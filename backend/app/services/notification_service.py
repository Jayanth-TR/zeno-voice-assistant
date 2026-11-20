import base64
import json
import logging
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)


class SMENotificationService:
    """
    Service responsible for dispatching connection notifications to SMEs via WhatsApp.
    Supports:
      1. Meta WhatsApp Cloud API (Graph API)
      2. Twilio WhatsApp API
      3. Custom WhatsApp Webhook / Gateway
      4. Simulated/Dev logging mode when no live WhatsApp provider credentials are configured.
    """

    def __init__(self):
        # 1. Meta WhatsApp Cloud API
        self.meta_token = os.getenv("WHATSAPP_TOKEN")
        self.meta_phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

        # 2. Twilio WhatsApp API
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_from = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

        # 3. Generic WhatsApp Gateway / Webhook
        self.webhook_url = os.getenv("WHATSAPP_WEBHOOK_URL")

    def is_configured(self) -> bool:
        """Returns True if any live WhatsApp delivery provider is configured."""
        has_meta = bool(self.meta_token and self.meta_phone_number_id)
        has_twilio = bool(self.twilio_account_sid and self.twilio_auth_token)
        has_webhook = bool(self.webhook_url)
        return has_meta or has_twilio or has_webhook

    @staticmethod
    def clean_phone_for_whatsapp(phone: str) -> str:
        """
        Clean and format phone number for WhatsApp international standard (E.164 without '+').
        e.g., '+91 98100 12345' -> '919810012345'
        """
        digits = re.sub(r"[^\d]", "", phone.strip())
        # Default standard 10-digit Indian numbers without country code
        if len(digits) == 10:
            digits = "91" + digits
        return digits

    def format_whatsapp_message(
        self,
        sme_name: str,
        visitor_name: str,
        visitor_email: str,
        visitor_phone: str,
        industry: str,
        preference: str,
        request_id: str,
        preferred_date_time: Optional[str] = None,
        business_requirement: Optional[str] = None,
    ) -> str:
        """
        Generate WhatsApp formatted notification message adhering to Zeno event specs.
        Uses WhatsApp markdown (*bold*, _italic_, bullet points).
        """
        pref_display_map = {
            "request_a_callback": "Request a callback",
            "request_a_call": "Request a call",
            "request_a_meeting": "Request a meeting or call",
            "contact_by_email": "Contact me by email",
            "callback": "Request a callback",
            "meeting": "Request a meeting or call",
            "email": "Contact me by email",
        }
        pref_label = pref_display_map.get(preference.lower(), preference.replace("_", " ").title())

        extra_fields = ""
        if preferred_date_time:
            extra_fields += f"• *Preferred Time:* {preferred_date_time}\n"
        if business_requirement:
            extra_fields += f"• *Enquiry / Requirement:* {business_requirement}\n"

        message = (
            f"🔔 *New Visitor Connection Request – Zeno*\n\n"
            f"Hello *{sme_name}*,\n\n"
            f"A visitor at the event has requested to connect with you via Zeno AI Assistant.\n\n"
            f"📋 *Visitor Details:*\n"
            f"• *Name:* {visitor_name}\n"
            f"• *Email:* {visitor_email}\n"
            f"• *Mobile:* {visitor_phone}\n"
            f"• *Industry:* {industry}\n"
            f"• *Connection Preference:* {pref_label}\n"
            f"{extra_fields}"
            f"• *Requested Expert:* {sme_name}\n"
            f"• *Request ID:* {request_id}\n\n"
            f"_Please follow up with this visitor regarding their enquiry._\n\n"
            f"—\n"
            f"*Zeno AI Event Assistant*\n"
            f"Netcore Interactive Experience"
        )
        return message

    def format_email_body(
        self,
        sme_name: str,
        visitor_name: str,
        visitor_email: str,
        visitor_phone: str,
        industry: str,
        preference: str,
        request_id: str,
    ) -> str:
        """
        Preserved for backwards compatibility with email references.
        """
        pref_display_map = {
            "request_a_callback": "Request a callback",
            "request_a_call": "Request a call",
            "request_a_meeting": "Request a meeting or call",
            "contact_by_email": "Contact me by email",
            "callback": "Callback",
            "meeting": "Meeting",
            "email": "Email",
        }
        pref_label = pref_display_map.get(preference.lower(), preference.replace("_", " ").title())

        return (
            f"Hello {sme_name},\n\n"
            f"A visitor at the event has requested to connect with you.\n\n"
            f"Visitor Details:\n\n"
            f"Name: {visitor_name}\n\n"
            f"Email: {visitor_email}\n\n"
            f"Mobile: {visitor_phone}\n\n"
            f"Industry: {industry}\n\n"
            f"Connection Preference: {pref_label}\n\n"
            f"Requested Expert: {sme_name}\n\n"
            f"Request ID: {request_id}\n\n"
            f"Please follow up with this visitor.\n\n"
            f"Regards,\n"
            f"Zeno AI Assistant"
        )

    def _send_via_meta(self, to_phone: str, message_body: str) -> Tuple[bool, str]:
        """Dispatch via Meta WhatsApp Cloud API."""
        url = f"https://graph.facebook.com/v20.0/{self.meta_phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.meta_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_phone,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": message_body,
            },
        }
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                resp_data = json.loads(response.read().decode("utf-8"))
                logger.info("Meta WhatsApp Cloud API message sent to %s: %s", to_phone, resp_data)
                return True, "Notification dispatched successfully via Meta WhatsApp Cloud API."
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            logger.error("Meta WhatsApp Cloud API HTTP %d error: %s", e.code, err_body)
            return False, f"Meta WhatsApp HTTP {e.code}: {err_body}"
        except Exception as e:
            logger.exception("Failed to dispatch WhatsApp via Meta API: %s", e)
            return False, f"Meta WhatsApp API delivery failed: {str(e)}"

    def _send_via_twilio(self, to_phone: str, message_body: str) -> Tuple[bool, str]:
        """Dispatch via Twilio WhatsApp API."""
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_account_sid}/Messages.json"
        auth_str = f"{self.twilio_account_sid}:{self.twilio_auth_token}"
        b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("ascii")

        form_data = urllib.parse.urlencode({
            "From": self.twilio_from,
            "To": f"whatsapp:+{to_phone}",
            "Body": message_body,
        }).encode("utf-8")

        headers = {
            "Authorization": f"Basic {b64_auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        try:
            req = urllib.request.Request(url, data=form_data, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10) as response:
                resp_data = json.loads(response.read().decode("utf-8"))
                logger.info("Twilio WhatsApp message sent to %s: SID=%s", to_phone, resp_data.get("sid"))
                return True, "Notification dispatched successfully via Twilio WhatsApp API."
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            logger.error("Twilio WhatsApp HTTP %d error: %s", e.code, err_body)
            return False, f"Twilio WhatsApp HTTP {e.code}: {err_body}"
        except Exception as e:
            logger.exception("Failed to dispatch WhatsApp via Twilio: %s", e)
            return False, f"Twilio WhatsApp delivery failed: {str(e)}"

    def _send_via_webhook(self, to_phone: str, message_body: str, metadata: dict) -> Tuple[bool, str]:
        """Dispatch via generic WhatsApp Gateway / Webhook."""
        headers = {"Content-Type": "application/json"}
        payload = {
            "channel": "whatsapp",
            "to": to_phone,
            "message": message_body,
            "metadata": metadata,
        }
        try:
            req = urllib.request.Request(
                self.webhook_url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                logger.info("WhatsApp Webhook triggered for %s, status=%d", to_phone, response.status)
                return True, "Notification dispatched successfully via WhatsApp Webhook Gateway."
        except Exception as e:
            logger.exception("Failed to dispatch WhatsApp via webhook: %s", e)
            return False, f"WhatsApp Webhook delivery failed: {str(e)}"

    def send_notification(
        self,
        sme: Dict[str, Any],
        request_data: Dict[str, Any],
    ) -> Tuple[bool, str]:
        """
        Send WhatsApp notification to the selected SME.
        Returns: (success: bool, detail_message: str)
        """
        sme_name = sme.get("name", "Subject Matter Expert")
        raw_phone = sme.get("notification_whatsapp") or sme.get("phone") or os.getenv("DEFAULT_SME_WHATSAPP")
        
        if not raw_phone:
            logger.error("SME %s (%s) has no WhatsApp notification number configured.", sme.get("id"), sme_name)
            return False, "SME WhatsApp notification destination is missing."

        clean_phone = self.clean_phone_for_whatsapp(raw_phone)
        if len(clean_phone) < 7:
            logger.error("SME %s (%s) has invalid WhatsApp phone number: %s", sme.get("id"), sme_name, raw_phone)
            return False, f"Invalid SME WhatsApp phone number format: {raw_phone}"

        body = self.format_whatsapp_message(
            sme_name=sme_name,
            visitor_name=request_data.get("full_name", ""),
            visitor_email=request_data.get("email", ""),
            visitor_phone=request_data.get("phone", ""),
            industry=request_data.get("industry", ""),
            preference=request_data.get("connection_preference", ""),
            request_id=request_data.get("id", ""),
            preferred_date_time=request_data.get("preferred_date_time"),
            business_requirement=request_data.get("business_requirement"),
        )

        # 1. Meta WhatsApp Cloud API
        if self.meta_token and self.meta_phone_number_id:
            logger.info("Dispatching WhatsApp notification to %s via Meta Cloud API...", clean_phone)
            return self._send_via_meta(clean_phone, body)

        # 2. Twilio WhatsApp API
        if self.twilio_account_sid and self.twilio_auth_token:
            logger.info("Dispatching WhatsApp notification to %s via Twilio WhatsApp API...", clean_phone)
            return self._send_via_twilio(clean_phone, body)

        # 3. Generic Webhook
        if self.webhook_url:
            logger.info("Dispatching WhatsApp notification to %s via Webhook Gateway...", clean_phone)
            return self._send_via_webhook(clean_phone, body, {"sme_id": sme.get("id"), "request_id": request_data.get("id")})

        # 4. Simulated / Development mode
        logger.info(
            "\n" + "=" * 65 + "\n"
            "[SME WHATSAPP NOTIFICATION SIMULATION - CREDENTIALS UNSET]\n"
            "To enable live WhatsApp delivery, configure one of the following in backend/.env:\n"
            "  Option A (Meta Cloud API): WHATSAPP_TOKEN & WHATSAPP_PHONE_NUMBER_ID\n"
            "  Option B (Twilio WhatsApp): TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN\n"
            "  Option C (Generic Webhook): WHATSAPP_WEBHOOK_URL\n\n"
            f"Recipient SME: {sme_name} (ID: {sme.get('id')})\n"
            f"WhatsApp Destination: +{clean_phone}\n"
            f"Message Body:\n{body}\n"
            + "=" * 65
        )
        return True, "Notification recorded (Simulated: WhatsApp credentials not set)."


notification_service = SMENotificationService()
