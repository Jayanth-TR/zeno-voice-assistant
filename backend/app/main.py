
import asyncio
import base64
import logging
import os
import re
import time
import uuid
from contextlib import suppress
from typing import Any, AsyncIterator, Dict, Optional, Set

import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_core.messages import AIMessage, HumanMessage

from app.agents.graph import (
    conversation_graph,
    build_response_messages,
    model,
)
from app.api.documents import router as documents_router
from app.api.industries import router as industries_router
from app.api.sme import router as sme_router
from app.api.whatsapp import router as whatsapp_router
from app.api.leads import router as leads_router
from app.websocket.transcription import router as transcription_router
from app.services.chunker import TTSChunker
from app.db import init_db
from app.db.mongodb import init_leads_db


# ---------------------------------------------------------
# Logging
# ---------------------------------------------------------

logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------

app = FastAPI(
    title="Zeno Voice Assistant",
    description="Standalone AI assistant for Netcore events",
    version="1.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router)
app.include_router(industries_router)
app.include_router(sme_router)
app.include_router(whatsapp_router)
app.include_router(leads_router)
app.include_router(transcription_router)

# Initialize SME database and seed initial records
init_db()


@app.on_event("startup")
async def on_startup():
    await init_leads_db()


# ---------------------------------------------------------
# Health Endpoints
# ---------------------------------------------------------

@app.get("/")
async def root():
    return {
        "status": "online",
        "assistant": "Zeno",
    }



class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = None
    model: Optional[str] = None


_DYNAMIC_TTS_CACHE: dict[str, str] = {}


@app.post("/api/tts")
async def api_tts(req: TTSRequest):
    """Direct TTS generation using existing OpenAI voice pipeline with memory cache."""
    clean = req.text.strip()
    if clean in _DYNAMIC_TTS_CACHE:
        return {"audio": _DYNAMIC_TTS_CACHE[clean]}

    b64_audio = await generate_sentence_tts(
        clean,
        voice=req.voice or OPENAI_TTS_VOICE,
        model=req.model or OPENAI_TTS_MODEL,
    )
    if b64_audio:
        _DYNAMIC_TTS_CACHE[clean] = b64_audio
    return {"audio": b64_audio}


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "zeno-backend",
    }


# ---------------------------------------------------------
# OpenAI Text-to-Speech (TTS) Configuration & Helper
# ---------------------------------------------------------

OPENAI_TTS_VOICE = os.getenv("OPENAI_TTS_VOICE", "nova")
OPENAI_TTS_MODEL = os.getenv("OPENAI_TTS_MODEL", "tts-1")

TTS_MIN_WORDS = int(os.getenv("TTS_MIN_WORDS", "3"))
TTS_MAX_WORDS = int(os.getenv("TTS_MAX_WORDS", "40"))
TTS_FLUSH_ON_SENTENCE = os.getenv("TTS_FLUSH_ON_SENTENCE", "True").lower() in ("true", "1")

_cached_greeting_b64: Optional[str] = None
_cached_goodbye_b64: Optional[str] = None

GREETING_TEXT = "Hey! I am Zeno, your AI Assistant. Please select your industry, and then let's clarify your questions."
GOODBYE_TEXT = "Thank you! It was great chatting with you. Have a wonderful day!"

# Load persistent on-disk audio caches immediately
_CACHE_DIR = os.path.join(os.path.dirname(__file__), "cache")
_GREETING_CACHE_FILE = os.path.join(_CACHE_DIR, "greeting.mp3")
_GOODBYE_CACHE_FILE = os.path.join(_CACHE_DIR, "goodbye.mp3")

if os.path.exists(_GREETING_CACHE_FILE):
    try:
        with open(_GREETING_CACHE_FILE, "rb") as _f:
            _cached_greeting_b64 = base64.b64encode(_f.read()).decode("ascii")
            logger.info("Loaded pre-generated greeting audio from on-disk cache (%d b64 chars).", len(_cached_greeting_b64))
    except Exception as _e:
        logger.warning("Could not read greeting cache file: %s", _e)

if os.path.exists(_GOODBYE_CACHE_FILE):
    try:
        with open(_GOODBYE_CACHE_FILE, "rb") as _f:
            _cached_goodbye_b64 = base64.b64encode(_f.read()).decode("ascii")
            logger.info("Loaded pre-generated goodbye audio from on-disk cache (%d b64 chars).", len(_cached_goodbye_b64))
    except Exception as _e:
        logger.warning("Could not read goodbye cache file: %s", _e)

_INDUSTRY_GREETINGS_CACHE: dict[str, str] = {}
for _ind_key, _ind_file in [
    ("ecommerce", "greeting_ecommerce.mp3"),
    ("banking", "greeting_banking.mp3"),
    ("insurance", "greeting_insurance.mp3"),
]:
    _p = os.path.join(_CACHE_DIR, _ind_file)
    if os.path.exists(_p):
        try:
            with open(_p, "rb") as _f:
                _INDUSTRY_GREETINGS_CACHE[_ind_key] = base64.b64encode(_f.read()).decode("ascii")
                logger.info("Loaded pre-generated industry greeting audio for '%s'", _ind_key)
        except Exception as _e:
            logger.warning("Could not read %s: %s", _ind_file, _e)

async def get_or_create_greeting_audio(text: Optional[str] = None) -> str:
    global _cached_greeting_b64
    target_text = (text or GREETING_TEXT).strip()
    if target_text == GREETING_TEXT and _cached_greeting_b64:
        return _cached_greeting_b64

    if _cached_greeting_b64 is None or (text and text.strip() != GREETING_TEXT):
        try:
            logger.info("Generating and caching greeting TTS audio for: %s", target_text)
            audio = await generate_sentence_tts(
                target_text,
                voice=OPENAI_TTS_VOICE,
                model=OPENAI_TTS_MODEL,
            )
            if target_text == GREETING_TEXT and audio:
                _cached_greeting_b64 = audio
            logger.info("Greeting TTS audio ready.")
            return audio or ""
        except Exception as e:
            logger.warning("Could not cache greeting audio: %s", e)
            return ""
    return _cached_greeting_b64 or ""


async def get_or_create_goodbye_audio() -> str:
    global _cached_goodbye_b64
    if _cached_goodbye_b64:
        return _cached_goodbye_b64

    if _cached_goodbye_b64 is None:
        try:
            logger.info("Generating and caching goodbye TTS audio...")
            _cached_goodbye_b64 = await generate_sentence_tts(
                GOODBYE_TEXT,
                voice=OPENAI_TTS_VOICE,
                model=OPENAI_TTS_MODEL,
            )
            logger.info("Goodbye TTS audio cached successfully.")
        except Exception as e:
            logger.warning("Could not cache goodbye audio: %s", e)
    return _cached_goodbye_b64 or ""


async def generate_sentence_tts(
    text: str,
    api_key: Optional[str] = None,
    model: str = "tts-1",
    voice: str = "nova",
) -> Optional[str]:
    """
    Generate speech for a sentence using OpenAI Audio Speech API.
    Returns base64 encoded MP3 string, or None if generation failed.
    Cleans markdown links before speaking (e.g. [Netcore](url) -> Netcore).
    """
    clean_text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text).strip()
    if not clean_text:
        return None

    key = api_key or os.getenv("OPENAI_API_KEY")
    if not key:
        logger.warning("OPENAI_API_KEY is not configured for TTS.")
        return None

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "voice": voice,
                    "input": clean_text,
                    "response_format": "mp3",
                },
            )
            if response.status_code == 200:
                return base64.b64encode(response.content).decode("ascii")
            else:
                logger.error(
                    "OpenAI TTS API returned %d: %s",
                    response.status_code,
                    response.text,
                )
                return None
    except asyncio.CancelledError:
        raise
    except Exception as e:
        logger.warning("Failed to generate TTS for sentence '%s': %s", text[:30], e)
        return None


# ---------------------------------------------------------
# Streaming Helpers
# ---------------------------------------------------------

def chunk_to_text(chunk: Any) -> str:
    """
    Extract text from a LangChain streaming chunk.
    Supports both string and list-based content.
    """

    content = getattr(chunk, "content", "")

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        pieces = []

        for block in content:
            if isinstance(block, str):
                pieces.append(block)

            elif isinstance(block, dict):
                if block.get("type") in ("text", "output_text"):
                    pieces.append(block.get("text", ""))

        return "".join(pieces)

    return ""


def clean_for_speech(text: str) -> str:
    """
    Transform display text into natural conversational English for Text-to-Speech:
    - Strips markdown links: [Anchor](url) -> Anchor
    - Strips raw URLs (https://...)
    - Strips bold, italic, code formatting (*, **, _, __, `)
    - Strips list bullets (-, *, +) and numbered list prefixes (1., 2.)
    - Strips markdown headers (# Header)
    - Strips document file names (.md, .pdf) and page citations (e.g. Page 5)
    - Expands symbols: % -> percent, & -> and, e.g. -> for example, i.e. -> that is
    - Cleans extra punctuation and whitespace
    """
    if not text:
        return ""

    s = text

    # 1. Markdown links [Anchor](url) -> Anchor
    s = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", s)

    # 2. Raw URLs
    s = re.sub(r"https?://\S+", "", s)

    # 3. Document filenames and page citations
    s = re.sub(r"\b\w+[\w\-.]*\.(?:md|pdf|docx|txt)\b", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\bPage\s+\d+\b", "", s, flags=re.IGNORECASE)

    # 4. List bullets and numbered item prefixes
    s = re.sub(r"^\s*[-*+•·]\s*", "", s)
    s = re.sub(r"^\s*\d+\.\s+", "", s)
    s = re.sub(r"\n\s*[-*+•·]\s*", " ", s)
    s = re.sub(r"\n\s*\d+\.\s+", " ", s)

    # 5. Markdown headers
    s = re.sub(r"#+\s*", "", s)

    # 6. Bold, italic, backticks
    s = re.sub(r"[*_`~]", "", s)

    # 7. Colon after item names at start of sentence, e.g. "Audience Agent: Creates" -> "Audience Agent. It creates" or "Audience Agent creates"
    s = re.sub(r"^([A-Z][a-zA-Z\s]{2,25}):\s*([A-Z])", r"\1 \2", s)
    s = re.sub(r"^([A-Z][a-zA-Z\s]{2,25}):\s*", r"\1: ", s)

    # 8. Symbol expansions
    s = re.sub(r"\b(\d+)\s*%", r"\1 percent", s)
    s = re.sub(r"\s*%\s*", " percent ", s)
    s = re.sub(r"\s*&\s*", " and ", s)
    s = re.sub(r"\be\.g\.,?\s*", "for example, ", s, flags=re.IGNORECASE)
    s = re.sub(r"\bi\.e\.,?\s*", "that is, ", s, flags=re.IGNORECASE)
    s = re.sub(r"\betc\.", "and so on", s, flags=re.IGNORECASE)
    s = re.sub(r"\bvs\.?\b", "versus", s, flags=re.IGNORECASE)

    # 9. Clean brackets, braces and stray characters
    s = re.sub(r"[\[\]{}<>]", "", s)

    # Clean dangling punctuation and prepositions from stripped citations
    s = re.sub(r"\s+([,.;!?])", r"\1", s)
    s = re.sub(r"([,;])\s*([,;])+", r"\1", s)
    s = re.sub(r"\b(or|and)\s*[,;]+", r"\1", s)
    s = re.sub(r"[,;]+\s*([.!?])", r"\1", s)
    s = re.sub(r"\b(or|and)\s*[.!?]+", ".", s)
    s = re.sub(r"\s+", " ", s).strip()

    return s


def fix_malformed_markdown_links(text: str) -> str:
    """
    Sanitize malformed or escaped Markdown links produced by LLMs.
    Converts:
      [anchor]\([url](url)) -> [anchor](url)
      [anchor]([url](url))  -> [anchor](url)
      [anchor]\(url\)       -> [anchor](url)
      [anchor]\(url)        -> [anchor](url)
      [anchor]([url])       -> [anchor](url)
    """
    if not text:
        return text

    # Pattern 1: [anchor]\([url1](url2)) or [anchor]([url1](url2))
    text = re.sub(
        r"\[(?P<text>[^\]]+)\]\\?\(\[(?:[^\]]+)\]\((?P<url>[^\)]+)\)\)",
        r"[\g<text>](\g<url>)",
        text,
    )

    # Pattern 2: [anchor]\(url\) or [anchor]\(url)
    text = re.sub(
        r"\[(?P<text>[^\]]+)\]\\?\((?P<url>https?://[^\s\)\\]+)\\?\)",
        r"[\g<text>](\g<url>)",
        text,
    )

    # Pattern 3: [anchor]([url])
    text = re.sub(
        r"\[(?P<text>[^\]]+)\]\(\[(?P<url>https?://[^\s\]]+)\]\)",
        r"[\g<text>](\g<url>)",
        text,
    )

    return text


def split_complete_sentences(buffer: str):
    """
    Split completed sentences from the streaming buffer.
    Keep unfinished text for the next token.
    """

    parts = re.split(r"(?<=[.!?])\s+", buffer)

    if len(parts) == 1:
        return [], buffer

    complete_sentences = [
        part.strip()
        for part in parts[:-1]
        if part.strip()
    ]

    remaining_text = parts[-1]

    return complete_sentences, remaining_text


async def iterate_with_timeout(
    async_iterator: AsyncIterator,
    timeout: int = 120,
):
    """
    Python 3.10-compatible async iterator timeout.

    Waits up to `timeout` seconds for each next streaming chunk.
    """

    iterator = async_iterator.__aiter__()

    while True:
        try:
            chunk = await asyncio.wait_for(
                iterator.__anext__(),
                timeout=timeout,
            )

        except StopAsyncIteration:
            break

        yield chunk


# ---------------------------------------------------------
# WebSocket Endpoint
# ---------------------------------------------------------

@app.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket):

    await websocket.accept()

    logger.info("Zeno WebSocket connected.")

    # Store only completed conversation exchanges.
    conversation_history = []

    active_task = None
    active_request_id = None

    # Prevent concurrent WebSocket sends.
    send_lock = asyncio.Lock()

    async def send_event(payload):

        async with send_lock:
            await websocket.send_json(payload)

    # Preload greeting & goodbye audio immediately to client for zero-latency instant playback
    async def _send_preloaded():
        b64 = await get_or_create_greeting_audio()
        if b64:
            with suppress(Exception):
                await send_event({
                    "type": "preloaded_greeting_audio",
                    "audio": b64,
                    "text": GREETING_TEXT,
                })
        b64_bye = await get_or_create_goodbye_audio()
        if b64_bye:
            with suppress(Exception):
                await send_event({
                    "type": "preloaded_goodbye_audio",
                    "audio": b64_bye,
                    "text": GOODBYE_TEXT,
                })

    asyncio.create_task(_send_preloaded())

    # -----------------------------------------------------
    # Generate Zeno Response
    # -----------------------------------------------------

    async def run_generation(
        request_id: str,
        user_text: str,
        history_snapshot,
        industry: Optional[str] = None,
        challenge_id: Optional[str] = None,
    ):

        nonlocal conversation_history

        working_history = (
            list(history_snapshot)
            + [HumanMessage(content=user_text)]
        )

        t_received = time.perf_counter()
        t_graph_done = None
        t_first_delta = None
        t_first_tts_submit = None
        t_first_audio_sent = None

        answer_parts = []
        chunk_sequence = 0
        tts_chunker = TTSChunker(
            min_words=TTS_MIN_WORDS,
            max_words=TTS_MAX_WORDS,
            flush_on_sentence=TTS_FLUSH_ON_SENTENCE,
            sentence_mode=True,
        )
        tts_queue: asyncio.Queue = asyncio.Queue(maxsize=30)
        ready_audio_chunks: Dict[int, Optional[str]] = {}
        next_send_sequence = 0
        tts_worker_tasks: Set[asyncio.Task] = set()
        audio_flush_lock = asyncio.Lock()

        async def flush_ready_audio():
            nonlocal next_send_sequence, t_first_audio_sent
            async with audio_flush_lock:
                while next_send_sequence in ready_audio_chunks:
                    b64_audio = ready_audio_chunks.pop(next_send_sequence)
                    if request_id == active_request_id:
                        if t_first_audio_sent is None and b64_audio is not None:
                            t_first_audio_sent = time.perf_counter()
                        logger.info(
                            "[%s] Sending audio_chunk seq %d (has_audio=%s)",
                            request_id,
                            next_send_sequence,
                            bool(b64_audio),
                        )
                        # New audio_chunk event protocol
                        await send_event({
                            "type": "audio_chunk",
                            "request_id": request_id,
                            "sequence": next_send_sequence,
                            "sentence_index": next_send_sequence,
                            "format": "mp3",
                            "audio": b64_audio,
                        })
                        # Backwards-compatible assistant_audio event for existing React UI
                        await send_event({
                            "type": "assistant_audio",
                            "request_id": request_id,
                            "sequence": next_send_sequence,
                            "sentence_index": next_send_sequence,
                            "format": "mp3",
                            "audio": b64_audio,
                        })
                    next_send_sequence += 1

        async def synthesize_chunk(seq_idx: int, phrase: str):
            try:
                spoken = clean_for_speech(phrase) if phrase else ""
                b64_audio = None
                if spoken and request_id == active_request_id:
                    logger.info("[%s] Synthesizing TTS for chunk %d: '%s'", request_id, seq_idx, spoken[:40])
                    b64_audio = await generate_sentence_tts(
                        spoken,
                        voice=OPENAI_TTS_VOICE,
                        model=OPENAI_TTS_MODEL,
                    )
                    logger.info(
                        "[%s] TTS chunk %d synthesized (has_audio=%s)",
                        request_id,
                        seq_idx,
                        bool(b64_audio),
                    )
                ready_audio_chunks[seq_idx] = b64_audio
                await flush_ready_audio()
            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.warning("[%s] TTS worker error for chunk %d: %s", request_id, seq_idx, e)
                ready_audio_chunks[seq_idx] = None
                await flush_ready_audio()

        async def tts_consumer_loop():
            try:
                while True:
                    if request_id != active_request_id:
                        break
                    item = await tts_queue.get()
                    if item == (None, None):
                        tts_queue.task_done()
                        break
                    seq_idx, phrase = item
                    worker = asyncio.create_task(synthesize_chunk(seq_idx, phrase))
                    tts_worker_tasks.add(worker)
                    worker.add_done_callback(tts_worker_tasks.discard)
                    tts_queue.task_done()

                # When all chunks queued, wait for active workers to complete
                if tts_worker_tasks:
                    await asyncio.gather(*list(tts_worker_tasks), return_exceptions=True)
                await flush_ready_audio()
            except asyncio.CancelledError:
                for w in list(tts_worker_tasks):
                    if not w.done():
                        w.cancel()
                raise

        consumer_task = asyncio.create_task(tts_consumer_loop())

        async def enqueue_phrase(phrase: str, is_dismissal_chunk: bool = False):
            nonlocal chunk_sequence, t_first_tts_submit
            if not phrase.strip():
                return
            clean_chunk = fix_malformed_markdown_links(phrase)
            spoken_chunk = clean_for_speech(clean_chunk)
            curr_idx = chunk_sequence
            chunk_sequence += 1

            if t_first_tts_submit is None:
                t_first_tts_submit = time.perf_counter()

            # Emit assistant_sentence for speech subtitle captions & backwards compatibility
            await send_event({
                "type": "assistant_sentence",
                "request_id": request_id,
                "sentence_index": curr_idx,
                "message": clean_chunk,
                "spoken_text": spoken_chunk,
                "is_dismissal": is_dismissal_chunk,
            })

            # Submit chunk to TTS queue for concurrent asynchronous synthesis
            await tts_queue.put((curr_idx, spoken_chunk))

        try:

            # ---------------------------------------------
            # Notify React that generation has started
            # ---------------------------------------------

            await send_event({
                "type": "assistant_start",
                "request_id": request_id,
            })

            logger.info(
                "[%s] Starting LangGraph retrieval.",
                request_id,
            )

            # ---------------------------------------------
            # Step 1: Run LangGraph
            # Query rewriting + RAG retrieval
            # ---------------------------------------------

            graph_state = await asyncio.wait_for(
                conversation_graph.ainvoke(
                    {
                        "messages": working_history,
                        "industry": industry or "",
                        "challenge_id": challenge_id or "",
                    }
                ),
                timeout=90,
            )

            t_graph_done = time.perf_counter()

            if request_id != active_request_id:
                return

            logger.info(
                "[%s] LangGraph retrieval completed.",
                request_id,
            )

            # ---------------------------------------------
            # Route Classification Inspection
            # ---------------------------------------------
            current_route = graph_state.get("route", "general") if isinstance(graph_state, dict) else "general"
            is_dismissal = (current_route == "dismissal")
            is_greeting_turn = (current_route == "greeting")

            # ---------------------------------------------
            # Step 2: Build final response messages
            # ---------------------------------------------

            response_messages = build_response_messages(
                graph_state
            )

            logger.info(
                "[%s] Starting GPT response streaming.",
                request_id,
            )

            # ---------------------------------------------
            # Step 3: Stream GPT response directly
            # Python 3.10-compatible timeout
            # ---------------------------------------------

            stream = model.astream(response_messages)

            async for chunk in iterate_with_timeout(
                stream,
                timeout=120,
            ):

                # Stop forwarding tokens from an old request.
                if request_id != active_request_id:
                    return

                token_text = chunk_to_text(chunk)

                if not token_text:
                    continue

                if t_first_delta is None:
                    t_first_delta = time.perf_counter()

                answer_parts.append(token_text)

                # Send incremental text delta to React immediately
                await send_event({
                    "type": "assistant_delta",
                    "request_id": request_id,
                    "delta": token_text,
                })

                # Accumulate into phrase chunker and enqueue ready chunks
                new_phrases = tts_chunker.add_delta(token_text)
                for phrase in new_phrases:
                    if request_id != active_request_id:
                        return
                    await enqueue_phrase(phrase, is_dismissal_chunk=is_dismissal)

            # ---------------------------------------------
            # Check if this request is still active
            # ---------------------------------------------

            if request_id != active_request_id:
                return

            # ---------------------------------------------
            # Flush remaining phrase buffer
            # ---------------------------------------------

            final_phrases = tts_chunker.flush()
            for phrase in final_phrases:
                if request_id != active_request_id:
                    return
                await enqueue_phrase(phrase, is_dismissal_chunk=is_dismissal)

            # ---------------------------------------------
            # If dismissal and answer was empty, guarantee a thank-you response
            # ---------------------------------------------
            if is_dismissal and not "".join(answer_parts).strip() and request_id == active_request_id:
                fallback_thankyou = "Thank you so much for chatting with me! Have a wonderful time exploring the event!"
                answer_parts.append(fallback_thankyou)
                await send_event({
                    "type": "assistant_delta",
                    "request_id": request_id,
                    "delta": fallback_thankyou,
                })
                await enqueue_phrase(fallback_thankyou, is_dismissal_chunk=True)

            # ---------------------------------------------
            # Signal EOF to consumer and wait briefly for pending TTS tasks
            # ---------------------------------------------
            await tts_queue.put((None, None))

            if request_id == active_request_id:
                # Wait up to 30 seconds max for consumer so all audio chunks are synthesized and flushed
                try:
                    await asyncio.wait_for(consumer_task, timeout=30.0)
                except Exception as e:
                    logger.warning("[%s] Consumer task wait timeout or error: %s", request_id, e)

            if request_id != active_request_id:
                return

            # ---------------------------------------------
            # Reconstruct complete answer
            # ---------------------------------------------

            answer = fix_malformed_markdown_links("".join(answer_parts).strip())

            # ---------------------------------------------
            # Save completed conversation
            # ---------------------------------------------

            if request_id == active_request_id:

                conversation_history = (
                    list(history_snapshot)
                    + [
                        HumanMessage(content=user_text),
                        AIMessage(content=answer),
                    ]
                )[-20:]

                internal_sources = (
                    graph_state.get("sources", [])
                    if isinstance(graph_state, dict)
                    else []
                )
                web_sources = (
                    graph_state.get("web_sources", [])
                    if isinstance(graph_state, dict)
                    else []
                )

                t_complete = time.perf_counter()
                metrics = {
                    "request_id": request_id,
                    "graph_latency_ms": round((t_graph_done - t_received) * 1000, 2) if t_graph_done else 0.0,
                    "first_token_latency_ms": round((t_first_delta - t_received) * 1000, 2) if t_first_delta else 0.0,
                    "first_tts_submit_latency_ms": round((t_first_tts_submit - t_received) * 1000, 2) if t_first_tts_submit else 0.0,
                    "first_audio_sent_latency_ms": round((t_first_audio_sent - t_received) * 1000, 2) if t_first_audio_sent else 0.0,
                    "total_backend_latency_ms": round((t_complete - t_received) * 1000, 2),
                    "chunks_count": chunk_sequence,
                }

                await send_event({
                    "type": "assistant_complete",
                    "request_id": request_id,
                    "full_response": answer,
                    "is_dismissal": is_dismissal,
                    "is_greeting": is_greeting_turn,
                    "total_sentences": chunk_sequence,
                    "total_chunks": chunk_sequence,
                    "metrics": metrics,
                    "sources": {
                        "internal": internal_sources or [],
                        "web": web_sources or [],
                    },
                })

                logger.info(
                    "[%s] Zeno response completed successfully. Total chunks: %d | Metrics: graph=%.1fms, first_token=%.1fms, first_tts=%.1fms, first_audio=%.1fms, total=%.1fms",
                    request_id,
                    chunk_sequence,
                    metrics["graph_latency_ms"],
                    metrics["first_token_latency_ms"],
                    metrics["first_tts_submit_latency_ms"],
                    metrics["first_audio_sent_latency_ms"],
                    metrics["total_backend_latency_ms"],
                )

        # -------------------------------------------------
        # Cancellation Handling
        # -------------------------------------------------

        except asyncio.CancelledError:

            logger.info(
                "[%s] Generation cancelled.",
                request_id,
            )

            if not consumer_task.done():
                consumer_task.cancel()
            for t in list(tts_worker_tasks):
                if not t.done():
                    t.cancel()

            with suppress(asyncio.CancelledError):
                await consumer_task

            raise

        # -------------------------------------------------
        # Timeout Handling
        # -------------------------------------------------

        except asyncio.TimeoutError:

            logger.error(
                "[%s] Zeno generation timed out.",
                request_id,
            )

            if request_id == active_request_id:

                error_payload = {
                    "type": "assistant_error",
                    "request_id": request_id,
                    "message": "Zeno took too long to respond. Please try again.",
                }
                await send_event(error_payload)
                await send_event({**error_payload, "type": "error"})

        # -------------------------------------------------
        # General Error Handling
        # -------------------------------------------------

        except Exception:

            logger.exception(
                "[%s] Zeno generation failed.",
                request_id,
            )

            if request_id == active_request_id:

                error_payload = {
                    "type": "assistant_error",
                    "request_id": request_id,
                    "message": "I'm having trouble processing that. Please try again.",
                }
                await send_event(error_payload)
                await send_event({**error_payload, "type": "error"})

        finally:
            if not consumer_task.done():
                consumer_task.cancel()
                with suppress(asyncio.CancelledError):
                    await consumer_task
            for t in list(tts_worker_tasks):
                if not t.done():
                    t.cancel()

    # -----------------------------------------------------
    # WebSocket Message Listener
    # -----------------------------------------------------

    try:

        while True:

            data = await websocket.receive_json()

            message_type = data.get("type")

            logger.info(
                "Received WebSocket message: %s",
                message_type,
            )

            # ---------------------------------------------
            # Reset Conversation
            # ---------------------------------------------

            if message_type == "reset_session":

                old_request_id = active_request_id

                # Invalidate the previous request.
                active_request_id = None

                if active_task and not active_task.done():

                    active_task.cancel()

                    with suppress(asyncio.CancelledError):
                        await active_task

                active_task = None

                conversation_history.clear()

                await send_event({
                    "type": "session_reset",
                    "cancelled_request_id": old_request_id,
                    "message": "Zeno's conversation has been reset.",
                })

                logger.info("Zeno conversation reset.")

                continue

            # ---------------------------------------------
            # Explicit Interruption / Cancel Generation
            # ---------------------------------------------

            if message_type == "cancel_generation":

                old_request_id = active_request_id
                active_request_id = None

                if active_task and not active_task.done():
                    active_task.cancel()
                    with suppress(asyncio.CancelledError):
                        await active_task

                await send_event({
                    "type": "generation_cancelled",
                    "request_id": old_request_id,
                })

                logger.info("[%s] Generation cancelled by client request.", old_request_id)

                continue

            # ---------------------------------------------
            # Validate Message Type
            # ---------------------------------------------


            # ---------------------------------------------
            # Greeting Audio Request (Reuses Existing TTS Pipeline without LangGraph)
            # ---------------------------------------------

            if message_type == "goodbye_tts":
                goodbye_id = str(data.get("request_id") or uuid.uuid4())
                goodbye_text = str(data.get("text") or GOODBYE_TEXT).strip()
                b64_audio = await get_or_create_goodbye_audio()
                await send_event({
                    "type": "preloaded_goodbye_audio",
                    "request_id": goodbye_id,
                    "audio": b64_audio,
                    "text": goodbye_text,
                })
                continue

            if message_type == "greeting_tts":

                greeting_id = str(data.get("request_id") or uuid.uuid4())
                greeting_text = str(
                    data.get("text") or "Welcome to Netcore. I am Zeno, your AI Brand Ambassador. How may I assist you today?"
                ).strip()

                logger.info(
                    "[%s] Generating greeting audio via existing TTS pipeline: %s",
                    greeting_id,
                    greeting_text,
                )

                if active_task and not active_task.done():
                    active_task.cancel()
                    with suppress(asyncio.CancelledError):
                        await active_task
                    active_task = None

                active_request_id = greeting_id

                await send_event({
                    "type": "assistant_start",
                    "request_id": greeting_id,
                    "is_greeting": True,
                })

                await send_event({
                    "type": "assistant_sentence",
                    "request_id": greeting_id,
                    "sentence_index": 0,
                    "message": greeting_text,
                    "spoken_text": greeting_text,
                })

                b64_audio = await get_or_create_greeting_audio(greeting_text)

                await send_event({
                    "type": "audio_chunk",
                    "request_id": greeting_id,
                    "sequence": 0,
                    "sentence_index": 0,
                    "format": "mp3",
                    "audio": b64_audio,
                })

                await send_event({
                    "type": "assistant_audio",
                    "request_id": greeting_id,
                    "sequence": 0,
                    "sentence_index": 0,
                    "format": "mp3",
                    "audio": b64_audio,
                })

                await send_event({
                    "type": "assistant_complete",
                    "request_id": greeting_id,
                    "is_greeting": True,
                    "total_sentences": 1,
                    "sources": {
                        "internal": [],
                        "web": [],
                    },
                })

                logger.info("[%s] Greeting audio delivered successfully.", greeting_id)
                continue

            if message_type != "user_message":

                await send_event({
                    "type": "error",
                    "message": "Unsupported message type.",
                })

                continue

            # ---------------------------------------------
            # Read User Message
            # ---------------------------------------------

            user_text = str(
                data.get("message", "")
            ).strip()

            if not user_text:
                continue

            request_id = str(
                data.get("request_id") or uuid.uuid4()
            )
            industry = data.get("industry")
            if industry and isinstance(industry, str):
                industry = industry.strip()
            else:
                industry = None

            challenge_id = data.get("challenge_id")
            if challenge_id and isinstance(challenge_id, str):
                challenge_id = challenge_id.strip()
            else:
                challenge_id = None

            logger.info(
                "[%s] User question: %s (Industry: %s | Challenge: %s)",
                request_id,
                user_text,
                industry or "None",
                challenge_id or "None",
            )

            old_request_id = active_request_id

            # ---------------------------------------------
            # Cancel Previous Generation
            # ---------------------------------------------

            if active_task and not active_task.done():

                # Invalidate the previous task first.
                active_request_id = request_id

                await send_event({
                    "type": "generation_cancelled",
                    "request_id": old_request_id,
                })

                active_task.cancel()

                with suppress(asyncio.CancelledError):
                    await active_task

            else:

                active_request_id = request_id

            # ---------------------------------------------
            # Snapshot Completed Conversation
            # ---------------------------------------------

            history_snapshot = list(
                conversation_history
            )

            # ---------------------------------------------
            # Start New Generation
            # ---------------------------------------------

            active_task = asyncio.create_task(
                run_generation(
                    request_id=request_id,
                    user_text=user_text,
                    history_snapshot=history_snapshot,
                    industry=industry,
                    challenge_id=challenge_id,
                )
            )

    # -----------------------------------------------------
    # WebSocket Disconnect
    # -----------------------------------------------------

    except WebSocketDisconnect:

        logger.info("Zeno visitor disconnected.")

    # -----------------------------------------------------
    # Cleanup
    # -----------------------------------------------------

    finally:

        active_request_id = None

        if active_task and not active_task.done():

            active_task.cancel()

            with suppress(asyncio.CancelledError):
                await active_task

        logger.info("Zeno WebSocket connection closed.")
