from app.agents.prompts import CONVERSATIONAL_PERSONALITY
import asyncio
import logging
import os
import re
from typing import Annotated, Any, Dict, List, Optional, TypedDict

from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

from app.agents.prompts import (
    ZENO_SYSTEM_PROMPT,
    RAG_GROUNDING_INSTRUCTIONS,
    CONVERSATIONAL_PERSONALITY,
    WEB_SEARCH_GROUNDING_INSTRUCTIONS,
    HYBRID_GROUNDING_INSTRUCTIONS,
    NETCORE_AI_AGENTS_INSTRUCTIONS,
)
from app.rag.retriever import retrieve_knowledge
from app.tools.web_search import search_web

load_dotenv()
logger = logging.getLogger(__name__)

WORKSPACE_ID = os.getenv("ZENO_WORKSPACE_ID", "default")
TOP_K = int(os.getenv("RAG_TOP_K", "8"))
MIN_HYBRID_SCORE = float(os.getenv("RAG_MIN_HYBRID_SCORE", "0.25"))
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-6.1-terra")

model = ChatOpenAI(
    model=MODEL_NAME,
    streaming=True,
    timeout=60,
    max_retries=2,
)


class ZenoState(TypedDict, total=False):
    messages: Annotated[List[BaseMessage], add_messages]
    rewritten_query: str
    route: str
    industry: str
    challenge_id: str
    retrieved_context: str
    web_context: str
    sources: List[Dict[str, Any]]
    web_sources: List[Dict[str, Any]]
    retrieval_status: str
    web_status: str


def get_latest_user_question(messages: List[BaseMessage]) -> str:
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            return message.content if isinstance(message.content, str) else str(message.content)
    return ""


def get_previous_conversation(messages: List[BaseMessage]) -> str:
    latest_user_index = None
    for index in range(len(messages) - 1, -1, -1):
        if isinstance(messages[index], HumanMessage):
            latest_user_index = index
            break
    if latest_user_index is None:
        return ""

    parts = []
    for message in messages[:latest_user_index][-6:]:
        if isinstance(message.content, str):
            role = "Visitor" if isinstance(message, HumanMessage) else "Zeno"
            parts.append(f"{role}: {message.content}")
    return "\n".join(parts)


DISMISSAL_PATTERNS = [
    r"^\s*no\s*$",
    r"^\s*nope\s*$",
    r"^\s*nah\s*$",
    r"^\s*nay\s*$",
    r"^\s*no\s+(thanks|thank\s*you|thx)\b",
    r"^\s*no\s+(i\s*dont|i\s*do\s*not|i\s*have\s*no|we\s*dont|we\s*have\s*no)\b",
    r"^\s*no\s+(other|more)?\s*questions?\b",
    r"^\s*no\s+(thats|that\s*is|it\s*is|its)\s*(all|it)?\b",
    r"^\s*no\s+nothing\b",
    r"^\s*no\s+(im|i\s*am|were|we\s*are)\s+good\b",
    r"^\s*no\s+(im|i\s*am)\s+fine\b",
    r"^\s*no\s+(not\s+really|not\s+now|not\s+right\s+now)\b",
    r"^\s*thats?\s*(all|it)\b",
    r"^\s*that\s+is\s+(all|it)\b",
    r"^\s*that\s+will\s+be\s+all\b",
    r"^\s*thatll\s+be\s+all\b",
    r"^\s*(im|i\s+am|were|we\s+are)\s+good\b",
    r"^\s*all\s*good\b",
    r"^\s*(im|i\s+am)\s+fine\b",
    r"^\s*nothing\s*(else|more)?\b",
    r"^\s*(i\s*dont|i\s*do\s*not)\s+have\s+(any|more|other)\s+questions?\b",
    r"^\s*not\s+really\b",
    r"^\s*not\s+right\s+now\b",
    r"^\s*done\b",
    r"^\s*(im|i\s+am)\s+done\b",
    r"^\s*(bye|goodbye|bye\s+bye|see\s+you)\b",
    r"^\s*(thank\s+you|thanks)\s*(bye|goodbye|so\s+much|a\s+lot)?\s*$",
    r"^\s*(thank\s+you|thanks)\s+(thats\s+all|that\s+is\s+all|im\s+good)\b",
]

GREETING_PATTERNS = [
    r"^\s*hey\s*(zeno|there)?\s*$",
    r"^\s*hi\s*(zeno|there)?\s*$",
    r"^\s*hello\s*(zeno|there)?\s*$",
    r"^\s*good\s*(morning|afternoon|evening)\s*(zeno)?\s*$",
    r"^\s*who\s+are\s+you\s*\??\s*$",
    r"^\s*zeno\s*$",
]

CUT_OFF_PATTERNS = [
    # Any sentence ending on a trailing preposition, conjunction, article, or copula
    r"\b(and|or|but|to|the|a|an|is|are|was|were|of|in|for|with|about|that|which|at|by|from|on|into|onto|because|so|if|than|like)\s*[.?!]*$",
    # Incomplete starters of 1-4 words that end without a subject/object
    r"^\s*(can|could|would|should|will)\s+you(\s+(tell|explain|show|help))?(\s+(me|us))?\s*[.?!]*$",
    r"^\s*(tell|show|explain)\s+(me|us)\s*[.?!]*$",
    r"^\s*i\s+(want|would\s+like|am\s+trying)\s+(to|to\s+know)?\s*[.?!]*$",
    r"^\s*(what|how|why|when|where|who)\s+(do|does|did|can|could|would|should|is|are|about)?\s*[.?!]*$",
]

def is_cut_off_input(text: str) -> bool:
    if not text:
        return True
    cleaned = text.strip()
    if not cleaned:
        return True
    clean_lower = re.sub(r"[.?!]+$", "", cleaned).lower().strip()
    words = clean_lower.split()
    if len(words) <= 1 and words[0] in ("what", "how", "why", "who", "where", "which", "tell", "can", "is", "are", "do"):
        return True
    return any(re.search(pat, clean_lower, re.IGNORECASE) for pat in CUT_OFF_PATTERNS)

def is_negative_dismissal(text: str) -> bool:
    if not text:
        return False
    # Strip apostrophes directly so 'don\'t' -> 'dont', 'that\'s' -> 'thats', 'I\'m' -> 'im'
    cleaned = re.sub(r"['’]", "", text)
    cleaned = re.sub(r"[^\w\s]", " ", cleaned).lower()
    cleaned = " ".join(cleaned.split())
    if not cleaned:
        return False
    has_question_word = bool(re.search(r"\b(what|how|why|when|where|who|tell|can you|explain|show|which)\b", cleaned))
    if has_question_word and len(cleaned.split()) > 3:
        return False
    return any(re.search(pat, cleaned, re.IGNORECASE) for pat in DISMISSAL_PATTERNS)

def is_greeting(text: str) -> bool:
    cleaned = re.sub(r"[^\w\s]", "", text).lower().strip()
    return any(re.search(pat, cleaned, re.IGNORECASE) for pat in GREETING_PATTERNS)


async def rewrite_query_node(state: ZenoState):
    messages = state.get("messages", [])
    original_query = get_latest_user_question(messages)
    if not original_query:
        return {"rewritten_query": ""}

    if is_cut_off_input(original_query) or is_greeting(original_query) or is_negative_dismissal(original_query):
        logger.info("Cut-off, greeting or dismissal detected (%s). Skipping query rewriting.", original_query)
        return {"rewritten_query": original_query}

    previous_conversation = get_previous_conversation(messages)
    if not previous_conversation.strip():
        logger.info("Standalone question. Skipping query rewriting.")
        return {"rewritten_query": original_query}

    rewrite_prompt = """
You rewrite the visitor's latest question into a standalone search query for
Zeno, a Netcore AI event assistant. Use the previous conversation to resolve
references such as it, that, this, the first one, and the second one.
Preserve intent and time references such as latest, current, today, and recent.
Do not answer or add facts. If already standalone, return it unchanged.
Return only the rewritten question.
"""
    try:
        response = await model.ainvoke([
            ("system", rewrite_prompt),
            ("human", f"Previous conversation:\n{previous_conversation}\n\nLatest question:\n{original_query}"),
        ])
        rewritten = str(response.content).strip().strip('"').strip("'")
        return {"rewritten_query": rewritten or original_query}
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception("Query rewriting failed; using original query.")
        return {"rewritten_query": original_query}

async def classify_intent_node(state: ZenoState):
    query = state.get("rewritten_query") or get_latest_user_question(state.get("messages", []))
    if not query:
        return {"route": "cut_off"}

    if is_cut_off_input(query):
        logger.info("Intent route=cut_off query=%s", query)
        return {"route": "cut_off"}

    if is_negative_dismissal(query):
        logger.info("Intent route=dismissal query=%s", query)
        return {"route": "dismissal"}

    if is_greeting(query):
        logger.info("Intent route=greeting query=%s", query)
        return {"route": "greeting"}

    prompt = """
You are the information-source router for Zeno, an AI assistant used at Netcore events.
Choose exactly one route and return only its label:

cut_off
Use when the visitor's question is incomplete, broken, cut off mid-sentence, or just an unfinished thought (e.g. "what are you...", "can you tell me...", "how does netcore...", "which agent is...", "and also...").

rag
Use for Netcore, its products/services, AI agents (such as Audience Agent, Content Agent, Scheduler Agent, Insights Agent, Decisioning Agent, Shopping Agent, the six agents, or Agentic Marketing), company or event details, internal knowledge documents, Industry Experience Center challenges (E-commerce cart recovery, repeat buyers, sale planning; Banking FD conversions, journey drop-offs, account dormancy; Insurance policy renewals, cross-selling, campaign ROI), uploaded materials, and follow-ups about Netcore features, agents, or industry solutions.

web_search
Use for latest/current/recent/today/breaking news, market updates, competitors,
technology trends, or other time-sensitive public information.

hybrid
Use when the question needs BOTH internal Netcore/event knowledge AND current
public information, such as current industry trends applied to Netcore.

general
Use for stable general explanations, definitions, reasoning, and examples that
do not require internal documents or current web information.

Do not choose web_search just because the question mentions AI.
Do not choose general if the question is asking about the six agents, specific named agents, Netcore capabilities, or Industry Experience Center questions (e.g. cart recovery, FD conversions, policy renewals).
Allowed outputs: cut_off, rag, web_search, hybrid, general.
"""
    try:
        response = await model.ainvoke([("system", prompt), ("human", f"Question: {query}")])
        text = str(response.content).strip().lower()
        match = re.search(r"\b(cut_off|rag|web_search|hybrid|general)\b", text)
        route = match.group(1) if match else "general"
        logger.info("Intent route=%s query=%s", route, query)
        return {"route": route}
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception("Intent classification failed; using safe fallback.")
        web_terms = ("latest", "recent", "today", "current", "news", "trend", "trends", "2025", "2026", "2027", "market", "competitor")
        company_terms = (
            "netcore", "event", "our product", "our service", "our company", "agent", "agents",
            "audience", "decisioning", "scheduler", "shopping", "co-marketer", "cart recovery",
            "abandoned cart", "repeat buyer", "sale planning", "fixed deposit", "fd conversion",
            "journey drop-off", "loan application", "dormant", "dormancy", "policy renewal",
            "cross-sell", "campaign roi", "ecommerce", "banking", "insurance"
        )
        q_lower = query.lower()
        has_web = any(x in q_lower for x in web_terms)
        has_company = any(x in q_lower for x in company_terms)
        if has_web and has_company:
            return {"route": "hybrid"}
        if has_company:
            return {"route": "rag"}
        if has_web:
            return {"route": "web_search"}
        return {"route": "general"}


async def _retrieve_rag(
    query: str,
    industry: Optional[str] = None,
    challenge_id: Optional[str] = None,
):
    try:
        results = await asyncio.to_thread(
            retrieve_knowledge,
            query=query,
            top_k=TOP_K,
            min_hybrid_score=MIN_HYBRID_SCORE,
            workspace_id=WORKSPACE_ID,
            industry=industry,
            challenge_id=challenge_id,
        )
        context_parts, sources = [], []
        for index, item in enumerate(results or [], start=1):
            source = item.get("source") or "Unknown source"
            page = item.get("page")
            file_type = item.get("file_type")
            approval = item.get("approval_status") or "unspecified"
            score = item.get("hybrid_score")
            sources.append({
                "source": source,
                "page": page,
                "file_type": file_type,
                "approval_status": approval,
                "document_id": item.get("document_id"),
                "hybrid_score": score,
            })
            source_label = f"{source}, page {page}" if page is not None else source
            context_parts.append(
                f"[INTERNAL EVIDENCE {index}]\nSource: {source_label}\n"
                f"File type: {file_type}\nApproval status: {approval}\n"
                f"Relevance score: {score}\n\nContent:\n{item.get('content', '')}"
            )
        return {
            "context": "\n\n".join(context_parts),
            "sources": sources,
            "status": "success" if sources else "no_results",
        }
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception("Knowledge retrieval failed.")
        return {"context": "", "sources": [], "status": "error"}


async def _retrieve_web(query: str):
    try:
        lower = query.lower()
        news_terms = ("news", "headlines", "breaking", "announced", "announcement")
        topic = "news" if any(term in lower for term in news_terms) else "general"
        result = await search_web(query=query, topic=topic)

        context_parts = []
        for index, item in enumerate(result.get("results", []), start=1):
            context_parts.append(
                f"[WEB EVIDENCE {index}]\nTitle: {item.get('title', '')}\n"
                f"URL: {item.get('url', '')}\nContent:\n{item.get('content', '')}"
            )
        return {
            "context": "\n\n".join(context_parts),
            "sources": result.get("sources", []),
            "status": result.get("status", "unknown"),
        }
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception("Web search failed.")
        return {"context": "", "sources": [], "status": "error"}


async def retrieve_knowledge_node(state: ZenoState):
    query = state.get("rewritten_query") or get_latest_user_question(state.get("messages", []))
    route = state.get("route", "general")
    industry = state.get("industry")
    challenge_id = state.get("challenge_id")

    if route in ("dismissal", "greeting", "cut_off"):
        return {
            "retrieved_context": "", "web_context": "", "sources": [], "web_sources": [],
            "retrieval_status": route, "web_status": "not_requested",
        }
    if not query:
        return {
            "retrieved_context": "", "web_context": "", "sources": [], "web_sources": [],
            "retrieval_status": "no_query", "web_status": "not_requested",
        }

    rag_result = {"context": "", "sources": [], "status": "not_requested"}
    web_result = {"context": "", "sources": [], "status": "not_requested"}
    tasks, names = [], []

    if route in ("rag", "hybrid"):
        tasks.append(_retrieve_rag(query, industry=industry, challenge_id=challenge_id))
        names.append("rag")
    if route in ("web_search", "hybrid"):
        tasks.append(_retrieve_web(query))
        names.append("web")

    if tasks:
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for name, result in zip(names, results):
            if isinstance(result, BaseException):
                if isinstance(result, asyncio.CancelledError):
                    raise result
                logger.error("%s retrieval task failed: %s", name, result)
                result = {"context": "", "sources": [], "status": "error"}
            if name == "rag":
                rag_result = result
            else:
                web_result = result

    logger.info(
        "Retrieval complete route=%s rag=%s web=%s",
        route, rag_result["status"], web_result["status"],
    )
    return {
        "retrieved_context": rag_result["context"],
        "sources": rag_result["sources"],
        "retrieval_status": rag_result["status"],
        "web_context": web_result["context"],
        "web_sources": web_result["sources"],
        "web_status": web_result["status"],
    }



def build_response_messages(state: ZenoState):
    route = state.get("route", "general")

    if route == "cut_off":
        cut_off_prompt = """You are Zeno, Netcore's friendly AI brand ambassador at an event.
The visitor's question was cut off mid-sentence before they could finish.
Politely ask what they were trying to say in 1 short, friendly sentence so they can finish asking their question.
Response: "It sounds like your question got cut off. What are you trying to say?"
CRITICAL: NEVER ask "Do you have any other questions?" because they haven't finished asking their question yet!"""
        return [("system", cut_off_prompt)] + state.get("messages", [])

    if route == "dismissal":
        dismissal_prompt = """You are Zeno, Netcore's friendly AI brand ambassador at an event.
The visitor just indicated they have no further questions (e.g. by saying "No", "Nope", "No thanks", "I'm good", "That's all", or "Thank you").
Warmly thank the visitor and sign off in 1 single short, friendly sentence.
You MUST begin with a warm thank you message.
Example: "Thank you so much for chatting with me! Have a wonderful time exploring the event!"
Another example: "Thank you for your time! Enjoy the rest of the event, and feel free to come back anytime!"
Do not ask any follow-up questions."""
        return [("system", dismissal_prompt)] + state.get("messages", [])

    if route == "greeting":
        greeting_prompt = """You are Zeno, Netcore's AI brand ambassador at an event.
The visitor just greeted you (e.g. saying "Hey Zeno", "Hello", or "Hi").
Give a professional, warm 1-sentence greeting introducing yourself and asking how you can assist them with Netcore today.
Response: "Welcome to Netcore. I am Zeno, your AI Brand Ambassador. How may I assist you today?"
Do not ask "Do you have any other questions?" because they haven't asked their first question yet."""
        return [("system", greeting_prompt)] + state.get("messages", [])

    route_instructions = ""

    if route == "rag":
        route_instructions = RAG_GROUNDING_INSTRUCTIONS

    elif route == "web_search":
        route_instructions = WEB_SEARCH_GROUNDING_INSTRUCTIONS

    elif route == "hybrid":
        route_instructions = (
            RAG_GROUNDING_INSTRUCTIONS
            + "\n\n"
            + WEB_SEARCH_GROUNDING_INSTRUCTIONS
            + "\n\n"
            + HYBRID_GROUNDING_INSTRUCTIONS
        )

    industry_context = state.get("industry", "").strip()
    challenge_context = state.get("challenge_id", "").strip()
    industry_section = (
        f"\nSELECTED VISITOR INDUSTRY & EXPERIENCE CENTER CONTEXT:\n"
        f"Industry: '{industry_context}'\n"
        f"Challenge ID: '{challenge_context}'\n"
        f"Contextual instruction: The visitor is exploring the Netcore Industry Experience Center for '{industry_context}'.\n"
        f"- Always ground your response in the retrieved internal evidence from the Industry Experience Center documents.\n"
        f"- State the direct answer and key findings with the precise verified metrics/numbers from the source (e.g. ₹21L/mo lost cart recovery, 18-24hr optimal window, Segment B intent; +18% FD bookings for ₹1L+ salary credit balance; 41% KYC drop-offs recovered with instant WhatsApp nudge; +4.5 pts timely policy renewal with 45-30-15-7 day cadence; -25% SMS spend with equal conversions).\n"
        f"- Highlight customer segments, recommended strategies, and relevant real customer success stories (e.g. Mulmul, BigHaat, Bacca Bucci, Equitas Bank, Shriram Finance, ClearTax, ICICI Life Insurance, Crocs, IGP).\n"
        f"- Conclude naturally by suggesting the relevant next follow-up questions from the evidence.\n"
        f"- NEVER fabricate or invent unsupported statistics, percentages, or client outcomes.\n"
        if industry_context
        else ""
    )

    system_prompt = f"""
{ZENO_SYSTEM_PROMPT}

{CONVERSATIONAL_PERSONALITY}

{route_instructions}

{NETCORE_AI_AGENTS_INSTRUCTIONS}
{industry_section}
INFORMATION SOURCE ROUTING
Selected route: {route}

INTERNAL KNOWLEDGE STATUS:
{state.get('retrieval_status', 'not_requested')}

INTERNAL KNOWLEDGE CONTEXT:
{state.get('retrieved_context') or 'No internal knowledge was retrieved.'}

PUBLIC WEB SEARCH STATUS:
{state.get('web_status', 'not_requested')}

PUBLIC WEB SEARCH CONTEXT:
{state.get('web_context') or 'No public web results were retrieved.'}

FINAL RESPONSE RULES:
- Talk like a real, friendly, knowledgeable human expert—warm, conversational, and engaging.
- ALWAYS answer the visitor's question directly and thoroughly FIRST with real, helpful substance before asking any follow-up question.
- NEVER respond by merely asking a question (e.g. do not just ask "Would you want to know about customer support?"). Answer the question immediately!
- For customer support or assistance inquiries: Explain that Netcore provides comprehensive 24/7 technical support, dedicated Customer Success Managers (CSMs), hands-on onboarding, and deliverability consulting to ensure marketing teams achieve high ROI.
- Structure your response so that EVERY SINGLE sentence is its own separate bullet point starting with '• ' (2 to 3 bullet points total).
- Each bullet point must contain exactly ONE complete sentence ending with a period (. ! ?), stating concrete metrics or findings from the internal evidence. Never combine multiple sentences into a single bullet point.
- NEVER end with generic lines like "Do you have any questions?" or "Do you have any other questions?".
- Only AFTER answering all bullet points, conclude naturally with the relevant follow-up or next step from the evidence.
- If an utterance was incomplete or cut off, ask what they were trying to say and NEVER ask "Do you have any other questions?".
- Voice-first: write smooth, natural sentences that sound clear spoken aloud; avoid long paragraphs.
- When explaining multiple agents, present them clearly using short concise bullets.
- Ground answers in the retrieved internal evidence. Follow approval status guidelines: explain what requires_validation or user_uploaded documents describe without unnecessarily refusing, while clarifying confirmation status when appropriate.
- When answering questions about Netcore's AI agents, explain the six specialized agents (Audience, Content, Scheduler, Insights, Decisioning, and Shopping). NEVER speak about, mention, speculate on, or reference a seventh agent or 7 agents under any circumstances; Netcore has six official AI agents.
- Use public web evidence for current information; distinguish confirmed capabilities from opportunities.
- Never invent Netcore capabilities or unsupported facts.

MARKDOWN LINK FORMATTING RULES (CRITICAL):
- When linking to a website, ALWAYS format links using standard, clean Markdown: [Anchor Text](https://example.com)
- NEVER escape parentheses or brackets (do NOT write \( or \) or \[ or \]).
- NEVER create nested Markdown links (e.g. do NOT write [anchor]\([url](url)) or [anchor]([url])).
- The anchor text must be plain words inside single square brackets: [website lists]
- The link target must be a raw URL inside single parentheses: (https://netcore.ai/...)
- Example of CORRECT link: Netcore's [website lists](https://netcore.ai/agentic-marketing/) products...
- Example of FORBIDDEN link: [website lists]\([https://netcore.ai/...](https://netcore.ai/...))
- Do not read raw URLs aloud.
"""

    return [("system", system_prompt)] + state.get("messages", [])

workflow = StateGraph(ZenoState)
workflow.add_node("rewrite_query", rewrite_query_node)
workflow.add_node("classify_intent", classify_intent_node)
workflow.add_node("retrieve_knowledge", retrieve_knowledge_node)
workflow.add_edge(START, "rewrite_query")
workflow.add_edge("rewrite_query", "classify_intent")
workflow.add_edge("classify_intent", "retrieve_knowledge")
workflow.add_edge("retrieve_knowledge", END)

# FastAPI continues streaming the final model call directly with model.astream().
conversation_graph = workflow.compile()
logger.info("Zeno routing + RAG + Web Search preparation graph initialized.")
