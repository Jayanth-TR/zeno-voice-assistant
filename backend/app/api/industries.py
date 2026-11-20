import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/industries",
    tags=["Industries"]
)

CONFIG_PATH = Path(__file__).resolve().parents[1] / "config" / "industry_questions.json"


def load_industry_config() -> Dict[str, Any]:
    if not CONFIG_PATH.exists():
        logger.error("Industry questions config file not found at %s", CONFIG_PATH)
        return {"industries": []}
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.exception("Failed to load industry questions configuration: %s", e)
        return {"industries": []}


@router.get("")
async def get_industries() -> Dict[str, Any]:
    """
    Get all available industries and their suggested questions.
    """
    config = load_industry_config()
    return config


@router.get("/{industry_id}/questions")
async def get_industry_questions(industry_id: str) -> Dict[str, Any]:
    """
    Get suggested questions for a specific industry by ID or name.
    """
    config = load_industry_config()
    target_id = industry_id.lower().strip()
    
    for ind in config.get("industries", []):
        if (
            ind.get("id", "").lower() == target_id
            or ind.get("name", "").lower() == target_id
        ):
            return {
                "industry_id": ind.get("id"),
                "industry_name": ind.get("name"),
                "questions": ind.get("questions", []),
            }
            
    raise HTTPException(status_code=404, detail=f"Industry '{industry_id}' not found.")

