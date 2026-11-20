import logging
import re
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def clean_phone_number(raw_phone: str) -> str:
    """
    Normalizes a phone number to standard international format with '+' prefix.
    e.g. '919876543210' -> '+919876543210'
         '+91 98765 43210' -> '+919876543210'
         '9876543210' (10 digits) -> '+919876543210'
    """
    if not raw_phone:
        return ""
    digits = re.sub(r"[^\d]", "", raw_phone)
    if len(digits) == 10:
        digits = "91" + digits
    return f"+{digits}" if digits else ""


def parse_whatsapp_message(
    body: str,
    from_whatsapp_number: str,
    sender_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Parse incoming WhatsApp lead submission message generated from Zeno QR / mobile form flow.

    Template format:
      Hi! I experienced the Zeno demo at your event and would like to request a personalized demo.

      Industry: Retail & E-commerce

      Name: Sarah Jenkins
      Company: Fashion Forward
      Work Email: sarah@fashionforward.com
      Contact Number: +91 9876543210
      Preferred Demo Date: 2026-11-25
    """
    text = (body or "").strip()

    # Regex patterns for template key-value extractions (business challenge removed per specification)
    patterns = {
        "industry": r"Industry\s*:\s*([^\n\r]+)",
        "challenge": r"Business\s*Challenge\s*:\s*([^\n\r]+)",
        "name": r"Name\s*:\s*([^\n\r]+)",
        "company": r"Company\s*:\s*([^\n\r]+)",
        "email": r"(?:Work\s*Email|Email)\s*:\s*([^\n\r]+)",
        "contact_number": r"(?:Contact\s*Number|Phone|Mobile|Contact)\s*:\s*([^\n\r]+)",
        "preferred_date": r"(?:Preferred\s*Demo\s*Date|Demo\s*Date|Preferred\s*Date|Date)\s*:\s*([^\n\r]+)",
    }

    extracted: Dict[str, str] = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            val = match.group(1).strip()
            # If the user left it as placeholder like "<Your Name>" or "Name:"
            if val and not re.match(r"^[<\[\(].+[>\]\)]$", val):
                extracted[key] = val

    # Fallback email extraction anywhere in text
    if not extracted.get("email"):
        email_match = re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", text)
        if email_match:
            extracted["email"] = email_match.group(0)

    # Fallback phone extraction
    if not extracted.get("contact_number"):
        phone_match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,6}", text)
        if phone_match:
            extracted["contact_number"] = clean_phone_number(phone_match.group(0))

    # Name fallback: if not in template, use sender_name provided by WhatsApp contacts
    name = extracted.get("name") or sender_name or "Event Visitor"
    company = extracted.get("company") or "Independent / Self"
    email = extracted.get("email") or "Pending Contact"
    contact_number = clean_phone_number(extracted.get("contact_number") or from_whatsapp_number)
    industry = extracted.get("industry") or "General Inquiry"
    challenge = extracted.get("challenge") or "Personalized Demo Request"
    preferred_date = extracted.get("preferred_date") or "Flexible / This Week"

    clean_from_number = clean_phone_number(from_whatsapp_number)

    logger.info(
        "[Lead Parser] Extracted lead: name='%s', company='%s', ind='%s'",
        name, company, industry
    )

    return {
        "whatsapp_number": clean_from_number or contact_number,
        "name": name,
        "company": company,
        "email": email,
        "contact_number": contact_number or clean_from_number,
        "industry": industry,
        "challenge": challenge,
        "preferred_date": preferred_date,
        "raw_message": text,
        "status": "New",
    }
