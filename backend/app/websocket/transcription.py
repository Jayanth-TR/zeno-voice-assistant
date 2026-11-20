import asyncio
import base64
import json
import logging
import os
import uuid
from contextlib import suppress
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import websockets
from websockets.exceptions import ConnectionClosed

logger = logging.getLogger(__name__)

router = APIRouter()

OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?intent=transcription"
DEFAULT_TRANSCRIBE_MODEL = "gpt-live-transcribe"
SAMPLE_RATE = 24000


@router.websocket("/ws/transcribe")
async def live_transcription_websocket(websocket: WebSocket):
    """
    Dedicated WebSocket endpoint for live audio transcription using
    OpenAI Realtime API (intent=transcription) with gpt-live-transcribe.
    
    Accepts raw 24kHz PCM16 binary chunks from React and streams
    partial ('transcript_delta') and final ('transcript_complete') events.
    """
    await websocket.accept()
    initial_recording_id = websocket.query_params.get("recording_id") or str(uuid.uuid4())
    current_recording_id = initial_recording_id
    logger.info("[%s] React client connected to /ws/transcribe.", current_recording_id)

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        logger.error("[%s] OPENAI_API_KEY is not configured on the backend.", current_recording_id)
        await websocket.send_json({
            "type": "error",
            "recording_id": current_recording_id,
            "message": "OPENAI_API_KEY is not configured on the backend.",
        })
        await websocket.close(code=1008)
        return

    transcribe_model = os.getenv("OPENAI_TRANSCRIBE_MODEL", DEFAULT_TRANSCRIBE_MODEL).strip()
    headers = {
        "Authorization": f"Bearer {api_key}",
    }

    openai_ws: Optional[websockets.ClientConnection] = None
    client_send_lock = asyncio.Lock()

    async def send_to_client(data: dict):
        if "recording_id" not in data:
            data["recording_id"] = current_recording_id
        async with client_send_lock:
            try:
                await websocket.send_json(data)
            except Exception:
                pass
            except Exception:
                pass

    try:
        logger.info("Connecting to OpenAI Realtime service (%s)...", OPENAI_REALTIME_URL)
        openai_ws = await websockets.connect(
            OPENAI_REALTIME_URL,
            additional_headers=headers,
            ping_interval=20,
            ping_timeout=20,
        )

        # 1. Wait for session.created from OpenAI
        init_raw = await asyncio.wait_for(openai_ws.recv(), timeout=10.0)
        init_evt = json.loads(init_raw)
        if init_evt.get("type") == "error":
            err_msg = init_evt.get("error", {}).get("message", "OpenAI Realtime connection failed.")
            logger.error("OpenAI session.created error: %s", init_evt)
            await send_to_client({"type": "error", "message": err_msg})
            return

        logger.info("OpenAI session created (id: %s).", init_evt.get("session", {}).get("id"))

        # 2. Configure session for transcription only (turn_detection=None)
        session_update_payload = {
            "type": "session.update",
            "session": {
                "type": "transcription",
                "audio": {
                    "input": {
                        "format": {
                            "type": "audio/pcm",
                            "rate": SAMPLE_RATE,
                        },
                        "transcription": {
                            "model": transcribe_model,
                        },
                        "turn_detection": None,
                    }
                },
            },
        }
        await openai_ws.send(json.dumps(session_update_payload))

        # 3. Wait for session.updated confirmation
        update_raw = await asyncio.wait_for(openai_ws.recv(), timeout=10.0)
        update_evt = json.loads(update_raw)
        if update_evt.get("type") == "error":
            err_msg = update_evt.get("error", {}).get("message", "Failed to update OpenAI transcription session.")
            logger.error("OpenAI session.update error: %s", update_evt)
            await send_to_client({"type": "error", "message": err_msg})
            return

        logger.info("OpenAI transcription session configured successfully with model %s.", transcribe_model)
        await send_to_client({
            "type": "session_ready",
            "model": transcribe_model,
            "sample_rate": SAMPLE_RATE,
        })

        # 4. Bidirectional pump tasks
        async def pump_openai_to_client():
            """Forward transcription events from OpenAI to React."""
            try:
                async for raw_message in openai_ws:
                    event = json.loads(raw_message)
                    event_type = event.get("type")

                    if event_type == "conversation.item.input_audio_transcription.delta":
                        delta_text = event.get("delta", "")
                        if delta_text:
                            await send_to_client({
                                "type": "transcript_delta",
                                "delta": delta_text,
                                "item_id": event.get("item_id"),
                            })

                    elif event_type == "conversation.item.input_audio_transcription.completed":
                        final_text = event.get("transcript", "")
                        is_empty = not bool(final_text.strip())
                        await send_to_client({
                            "type": "transcript_complete",
                            "recording_id": current_recording_id,
                            "transcript": final_text,
                            "empty": is_empty,
                            "item_id": event.get("item_id"),
                        })
                        logger.info("[%s] Transcription completed: '%s' (empty=%s)", current_recording_id, final_text, is_empty)

                    elif event_type == "error":
                        error_detail = event.get("error", {})
                        error_msg = error_detail.get("message", "Transcription error occurred.")
                        logger.error("OpenAI transcription error event: %s", error_detail)
                        await send_to_client({
                            "type": "error",
                            "message": error_msg,
                        })

            except ConnectionClosed:
                logger.info("OpenAI Realtime connection closed.")
            except asyncio.CancelledError:
                pass
            except Exception as exc:
                logger.error("Error in pump_openai_to_client: %s", exc)

        async def pump_client_to_openai():
            """Forward audio bytes and control events from React to OpenAI."""
            try:
                while True:
                    msg = await websocket.receive()
                    msg_type = msg.get("type")

                    if msg_type == "websocket.disconnect":
                        break

                    # Case A: Binary PCM audio chunk from React
                    audio_bytes = msg.get("bytes")
                    if audio_bytes:
                        b64_data = base64.b64encode(audio_bytes).decode("ascii")
                        await openai_ws.send(json.dumps({
                            "type": "input_audio_buffer.append",
                            "audio": b64_data,
                        }))
                        continue

                    # Case B: Text / JSON control message from React
                    text_data = msg.get("text")
                    if text_data:
                        try:
                            payload = json.loads(text_data)
                        except json.JSONDecodeError:
                            continue

                        if payload.get("recording_id"):
                            current_recording_id = str(payload.get("recording_id"))

                        action = payload.get("type")
                        if action == "commit":
                            # Finalize turn / flush buffered audio for completed transcript
                            await openai_ws.send(json.dumps({
                                "type": "input_audio_buffer.commit",
                            }))
                            logger.debug("[%s] Committed audio buffer to OpenAI.", current_recording_id)

                        elif action == "cancel":
                            # Discard current audio buffer
                            await openai_ws.send(json.dumps({
                                "type": "input_audio_buffer.clear",
                            }))
                            logger.debug("[%s] Cleared OpenAI audio buffer.", current_recording_id)

                        elif action == "ping":
                            await send_to_client({"type": "pong"})

            except WebSocketDisconnect:
                logger.info("Client disconnected from /ws/transcribe.")
            except asyncio.CancelledError:
                pass
            except Exception as exc:
                logger.error("Error in pump_client_to_openai: %s", exc)

        task_o2c = asyncio.create_task(pump_openai_to_client())
        task_c2o = asyncio.create_task(pump_client_to_openai())

        # Wait until either side finishes / disconnects
        done, pending = await asyncio.wait(
            [task_o2c, task_c2o],
            return_when=asyncio.FIRST_COMPLETED,
        )

        for task in pending:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected during setup.")
    except Exception as exc:
        logger.error("Exception in live_transcription_websocket: %s", exc, exc_info=True)
        with suppress(Exception):
            await send_to_client({
                "type": "error",
                "message": f"Transcription service error: {str(exc)}",
            })
    finally:
        if openai_ws:
            with suppress(Exception):
                await openai_ws.close()
            logger.info("OpenAI Realtime WebSocket connection closed.")
        with suppress(Exception):
            await websocket.close()
        logger.info("/ws/transcribe session ended.")

