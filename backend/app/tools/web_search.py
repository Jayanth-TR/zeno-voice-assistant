
import asyncio
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
try:
    from langchain_tavily import TavilySearch
except ImportError:
    TavilySearch = None

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")
load_dotenv()

logger = logging.getLogger(__name__)

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# Initialize Tavily search gracefully if key is configured
tavily_search = None
if TAVILY_API_KEY and TavilySearch is not None:
    try:
        tavily_search = TavilySearch(
            tavily_api_key=TAVILY_API_KEY,
            max_results=5,
            topic="general",
            search_depth="basic",
            include_answer=False,
            include_raw_content=False,
        )
        logger.info("Tavily web search service initialized successfully.")
    except Exception as exc:
        logger.warning("Failed to initialize TavilySearch client: %s", exc)
else:
    logger.info("TAVILY_API_KEY is not configured or langchain-tavily not installed. Web search fallback will be disabled.")


def clean_search_query(q: str) -> str:
    """Strip conversational filler words for cleaner search engine queries."""
    cleaned = re.sub(
        r"^(what\s+(is|are|was|were)|tell\s+me\s+about|can\s+you\s+tell\s+me|who\s+is|how\s+(does|do|can)|give\s+me|explain)\s+",
        "",
        q.strip(),
        flags=re.IGNORECASE,
    ).strip(" ?.!\"'")
    return cleaned if len(cleaned) > 3 else q.strip()


async def _execute_tavily(search_args: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Execute search via Tavily with timeout and error extraction."""
    if not tavily_search:
        logger.debug("Tavily search skipped: service is not configured.")
        return []
    try:
        response = await asyncio.wait_for(
            tavily_search.ainvoke(search_args),
            timeout=25,
        )
    except asyncio.TimeoutError:
        logger.warning(
            "Tavily search timed out for query: %s",
            search_args.get("query"),
        )
        return []
    except Exception as exc:
        logger.warning("Tavily invocation error: %s", exc)
        return []

    if isinstance(response, dict):
        if "error" in response:
            logger.warning("Tavily API error response: %s", response["error"])
            return []
        raw_items = response.get("results", [])
        if isinstance(raw_items, list):
            return raw_items

    return []


async def search_web(
    query: str,
    time_range: Optional[str] = None,
    topic: str = "general",
) -> Dict[str, Any]:
    """
    Search the web using Tavily with automatic query cleaning and topic fallback.

    Args:
        query: Search query.
        time_range: Optional day, week, month, or year filter.
        topic: general, news, or finance.

    Returns:
        Normalized search results and source URLs.
    """

    if not query or not query.strip():
        return {
            "query": query,
            "results": [],
            "sources": [],
            "status": "empty_query",
        }

    if not tavily_search:
        logger.debug("Tavily search not performed: TAVILY_API_KEY not configured.")
        return {
            "query": query,
            "results": [],
            "sources": [],
            "status": "tavily_not_configured",
        }

    try:
        logger.info("Tavily search started: %s (topic=%s)", query, topic)

        search_args: Dict[str, Any] = {
            "query": query.strip(),
            "topic": topic,
            "search_depth": "basic",
        }

        if time_range:
            search_args["time_range"] = time_range

        raw_results = await _execute_tavily(search_args)

        # Fallback 1: If "news" returned 0 results, retry with "general"
        if not raw_results and topic == "news":
            logger.info("Retrying Tavily search with topic='general'...")
            fallback_args = dict(search_args)
            fallback_args["topic"] = "general"
            raw_results = await _execute_tavily(fallback_args)

        # Fallback 2: If question-like query returned 0 results, clean the query
        cleaned_query = clean_search_query(query)
        if not raw_results and cleaned_query != query.strip():
            logger.info("Retrying Tavily search with cleaned query: %s", cleaned_query)
            clean_args = dict(search_args)
            clean_args["query"] = cleaned_query
            clean_args["topic"] = "general"
            raw_results = await _execute_tavily(clean_args)

        normalized_results: List[Dict[str, Any]] = []

        for item in raw_results:
            if not isinstance(item, dict):
                continue
            title = str(item.get("title") or item.get("url") or "Web Source").strip()
            url = str(item.get("url") or "").strip()
            content = str(item.get("content") or "").strip()
            normalized_results.append({
                "title": title,
                "url": url,
                "content": content,
                "score": item.get("score"),
            })

        sources = [
            {
                "title": item["title"],
                "url": item["url"],
            }
            for item in normalized_results
            if item.get("url")
        ]

        logger.info(
            "Tavily returned %s normalized results.",
            len(normalized_results),
        )

        return {
            "query": query,
            "results": normalized_results,
            "sources": sources,
            "status": "success" if normalized_results else "no_results",
        }

    except Exception:
        logger.exception("Tavily web search failed.")

        return {
            "query": query,
            "results": [],
            "sources": [],
            "status": "error",
        }
