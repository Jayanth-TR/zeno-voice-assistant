import json
import logging
import os

from fastapi import APIRouter, HTTPException, Query, Request, Response
from fastapi.responses import PlainTextResponse

from app.db.mongodb import insert_or_deduplicate_lead
from app.services.lead_parser import parse_whatsapp_message

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/whatsapp",
    tags=["WhatsApp Cloud API Webhook"]
)

# Meta Webhook Verification Token (configurable via environment variable)
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "zeno_whatsapp_verify_token_2026")


@router.get("/webhook", response_class=PlainTextResponse)
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """
    WhatsApp Cloud API Webhook Verification Endpoint.
    Meta calls this GET endpoint when setting up or verifying webhook subscriptions.
    """
    logger.info(
        "[WhatsApp Webhook] Verification request received: mode=%s, token_match=%s",
        hub_mode,
        hub_verify_token == WHATSAPP_VERIFY_TOKEN,
    )

    if hub_mode == "subscribe" and hub_verify_token == WHATSAPP_VERIFY_TOKEN:
        logger.info("[WhatsApp Webhook] Verification successful. Responding with challenge.")
        return Response(content=hub_challenge or "", media_type="text/plain")

    logger.warning("[WhatsApp Webhook] Verification failed. Token mismatch or bad mode.")
    raise HTTPException(status_code=403, detail="Verification token mismatch")


@router.post("/webhook")
async def receive_whatsapp_message(request: Request):
    """
    WhatsApp Cloud API Incoming Notification Endpoint.
    Receives incoming WhatsApp messages from visitors who scan the Zeno QR code
    and send the pre-filled demo request message.
    """
    try:
        payload = await request.json()
    except Exception as e:
        logger.warning("[WhatsApp Webhook] Invalid JSON payload received: %s", e)
        return {"status": "ignored", "reason": "invalid_json"}

    logger.info("[WhatsApp Webhook] Incoming event received: %s", json.dumps(payload)[:250])

    entries = payload.get("entry", [])
    processed_count = 0

    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])
            contacts = value.get("contacts", [])

            # Extract contact profile name if available
            contact_name = None
            if contacts and isinstance(contacts, list):
                profile = contacts[0].get("profile", {})
                contact_name = profile.get("name")

            for message in messages:
                msg_type = message.get("type")
                if msg_type != "text":
                    logger.info("[WhatsApp Webhook] Skipping non-text message type: %s", msg_type)
                    continue

                wa_msg_id = message.get("id")
                from_num = message.get("from", "")
                text_body = message.get("text", {}).get("body", "")

                if not text_body:
                    continue

                # Parse lead information from the message body
                parsed_lead = parse_whatsapp_message(
                    body=text_body,
                    from_whatsapp_number=from_num,
                    sender_name=contact_name,
                )
                parsed_lead["wa_message_id"] = wa_msg_id

                # Store or deduplicate in MongoDB / SQLite fallback
                saved_lead = await insert_or_deduplicate_lead(parsed_lead)
                processed_count += 1
                logger.info(
                    "[WhatsApp Webhook] Successfully processed lead %s from WhatsApp number %s",
                    saved_lead.get("lead_id"),
                    from_num,
                )

    return {
        "status": "EVENT_RECEIVED",
        "processed_leads": processed_count,
    }
