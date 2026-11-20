import logging
import re
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.db import (
    get_active_smes,
    get_sme_by_id,
    create_connection_request,
    update_connection_request,
    find_recent_duplicate,
)
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["SME Connection"]
)

# -------------------------------------------------------------
# Rate Limiting Helper (In-Memory per client IP)
# -------------------------------------------------------------
# Max 5 submissions per 60 seconds per IP
RATE_LIMIT_WINDOW = 60
MAX_REQUESTS_PER_WINDOW = 5
_ip_request_timestamps = defaultdict(list)


def check_rate_limit(client_ip: str):
    now = time.time()
    timestamps = _ip_request_timestamps[client_ip]
    # Filter out timestamps older than window
    valid_timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    _ip_request_timestamps[client_ip] = valid_timestamps

    if len(valid_timestamps) >= MAX_REQUESTS_PER_WINDOW:
        logger.warning("Rate limit exceeded for IP: %s", client_ip)
        raise HTTPException(
            status_code=429,
            detail="Too many connection requests submitted. Please wait a minute and try again.",
        )
    _ip_request_timestamps[client_ip].append(now)


# -------------------------------------------------------------
# Pydantic Request Models & Validation
# -------------------------------------------------------------
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
# Phone format: optional leading '+', digits, min 7, max 16 digits
PHONE_REGEX = re.compile(r"^\+?[0-9\s\-()]{7,20}$")


class SMEConnectionPayload(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str
    phone: str
    industry: str = Field(..., min_length=2, max_length=100)
    sme_id: str
    connection_preference: str
    consent: bool
    preferred_date_time: Optional[str] = None
    business_requirement: Optional[str] = None

    def validate_fields(self):
        cleaned_name = self.full_name.strip()
        if len(cleaned_name) < 2:
            raise HTTPException(status_code=400, detail="Full name must be at least 2 characters.")

        cleaned_email = self.email.strip().lower()
        if not EMAIL_REGEX.match(cleaned_email):
            raise HTTPException(status_code=400, detail="Invalid email address format.")

        cleaned_phone = re.sub(r"[\s\-()]", "", self.phone.strip())
        digits_only = re.sub(r"[^\d]", "", cleaned_phone)
        if len(digits_only) < 7 or len(digits_only) > 16:
            raise HTTPException(status_code=400, detail="Invalid phone number. Please include valid country code and number.")

        if not self.consent:
            raise HTTPException(status_code=400, detail="Consent is required to submit a connection request.")

        allowed_preferences = {
            "request_a_callback",
            "request_a_call",
            "request_a_meeting",
            "contact_by_email",
            "callback",
            "meeting",
            "email",
        }
        if self.connection_preference.lower() not in allowed_preferences:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid connection preference '{self.connection_preference}'.",
            )


# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------

@router.get("/smes")
def list_smes(industry: Optional[str] = None) -> Dict[str, Any]:
    """
    Get active SMEs without exposing private notification email addresses.
    Prioritizes SMEs matching the supplied industry if provided.
    """
    all_smes = get_active_smes()

    if industry:
        target_ind = industry.strip().lower()
        # Partition into matching and others
        matching = []
        others = []
        for sme in all_smes:
            supported = [ind.lower() for ind in sme.get("supported_industries", [])]
            if "all" in supported or target_ind in supported:
                matching.append(sme)
            else:
                others.append(sme)
        sorted_smes = matching + others
    else:
        sorted_smes = all_smes

    return {
        "smes": sorted_smes,
        "count": len(sorted_smes),
    }


@router.post("/sme-connection")
def submit_sme_connection(payload: SMEConnectionPayload, request: Request) -> Dict[str, Any]:
    """
    Submit visitor connection request, save to database, and trigger SME notification.
    """
    # 1. Rate limiting
    client_ip = request.client.host if request.client else "127.0.0.1"
    check_rate_limit(client_ip)

    # 2. Field validation
    payload.validate_fields()

    # 3. SME verification
    sme = get_sme_by_id(payload.sme_id)
    if not sme:
        raise HTTPException(status_code=404, detail="Selected SME not found.")
    if not sme.get("is_active"):
        raise HTTPException(status_code=400, detail="Selected SME is currently unavailable.")

    # 4. Duplicate protection (15 second debounce for same visitor + SME)
    if find_recent_duplicate(email=payload.email, sme_id=payload.sme_id, within_seconds=15):
        logger.info("Duplicate submission prevented for %s to SME %s", payload.email, payload.sme_id)
        raise HTTPException(
            status_code=409,
            detail="A connection request for this expert was just submitted. Please allow a few moments.",
        )

    # 5. Persist request in database
    conn_data = {
        "full_name": payload.full_name.strip(),
        "email": payload.email.strip().lower(),
        "phone": payload.phone.strip(),
        "industry": payload.industry.strip(),
        "sme_id": payload.sme_id.strip(),
        "connection_preference": payload.connection_preference.strip().lower(),
        "consent": payload.consent,
        "preferred_date_time": payload.preferred_date_time.strip() if payload.preferred_date_time else None,
        "business_requirement": payload.business_requirement.strip() if payload.business_requirement else None,
        "status": "pending",
        "notification_status": "pending",
    }
    
    saved_request = create_connection_request(conn_data)
    request_id = saved_request["id"]
    logger.info("Created connection request %s for %s to SME %s (%s)", request_id, payload.full_name, sme["name"], sme["id"])

    # 6. Dispatch notification
    notification_success, notify_detail = notification_service.send_notification(
        sme=sme,
        request_data=saved_request,
    )

    import urllib.parse
    clean_sme_phone = notification_service.clean_phone_for_whatsapp(
        sme.get("notification_whatsapp") or sme.get("phone") or "919342160653"
    )
    formatted_msg = notification_service.format_whatsapp_message(
        sme_name=sme["name"],
        visitor_name=saved_request["full_name"],
        visitor_email=saved_request["email"],
        visitor_phone=saved_request["phone"],
        industry=saved_request["industry"],
        preference=saved_request["connection_preference"],
        request_id=saved_request["id"],
    )
    wa_link = f"https://wa.me/{clean_sme_phone}?text={urllib.parse.quote(formatted_msg)}"

    now_iso = datetime.now(timezone.utc).isoformat()
    if notification_success:
        update_connection_request(
            request_id=request_id,
            status="notified",
            notification_status="sent",
            notified_at=now_iso,
        )
        return {
            "success": True,
            "request_id": request_id,
            "status": "notified",
            "notification_status": "sent",
            "message": "Thank you! Your connection request has been submitted successfully.",
            "expert_name": sme["name"],
            "sme_whatsapp": f"+{clean_sme_phone}",
            "whatsapp_link": wa_link,
            "whatsapp_message": formatted_msg,
        }
    else:
        update_connection_request(
            request_id=request_id,
            status="notification_failed",
            notification_status="failed",
            notified_at=None,
        )
        logger.warning("Notification delivery failed for request %s: %s", request_id, notify_detail)
        return {
            "success": True,
            "request_id": request_id,
            "status": "notification_failed",
            "notification_status": "failed",
            "message": "Thank you! Your connection request has been received. Our team will follow up with you shortly.",
            "expert_name": sme["name"],
            "sme_whatsapp": f"+{clean_sme_phone}",
            "whatsapp_link": wa_link,
            "whatsapp_message": formatted_msg,
        }
