import logging
import os
import socket
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.db.mongodb import (
    get_all_leads,
    get_lead_stats,
    insert_or_deduplicate_lead,
    update_lead_status,
)
from app.services.lead_parser import clean_phone_number

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/leads",
    tags=["Leads Management"]
)

# Client official WhatsApp Business number (configurable via .env)
CLIENT_WHATSAPP_NUMBER = os.getenv("WHATSAPP_BUSINESS_NUMBER", "+919342160653")


def get_local_lan_ip() -> str:
    """Detect LAN IP address so phone QR scanner can reach this kiosk machine."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


class CreateLeadRequest(BaseModel):
    name: str = Field(..., description="Visitor full name")
    company: str = Field(..., description="Company name")
    email: str = Field(..., description="Work email address")
    contact_number: str = Field(..., description="Mobile / WhatsApp number")
    industry: str = Field(..., description="Selected industry from dropdown")
    preferred_date: Optional[str] = Field("Flexible", description="Preferred demo date/time")


class StatusUpdateRequest(BaseModel):
    status: str = Field(..., description="Lead status: New, Contacted, Demo Scheduled, Demo Completed, Follow-up")
    notes: Optional[str] = Field(None, description="Internal admin notes regarding the lead")


class SimulateLeadRequest(BaseModel):
    name: Optional[str] = "Demo Visitor"
    company: Optional[str] = "Acme Global Enterprise"
    email: Optional[str] = "demo.visitor@acme.com"
    contact_number: Optional[str] = "+919876543210"
    industry: Optional[str] = "Banking & Fintech"
    challenge: Optional[str] = "Personalized Demo Request"
    preferred_date: Optional[str] = "Tomorrow 3:00 PM"


@router.get("/config")
async def get_lead_flow_config():
    """
    Returns public WhatsApp lead capture configuration for frontend QR generation.
    Includes detected LAN IP app_url for seamless phone scanning.
    """
    lan_ip = get_local_lan_ip()
    port = os.getenv("PORT", "5173")
    configured_app_url = os.getenv("APP_URL") or f"http://{lan_ip}:{port}"

    return {
        "whatsapp_business_number": CLIENT_WHATSAPP_NUMBER,
        "app_url": configured_app_url,
        "default_message_template": (
            "Hi! I experienced the Zeno demo at your event and would like to request a personalized demo.\n\n"
            "Industry: {industry}\n\n"
            "Name: {name}\n"
            "Company: {company}\n"
            "Work Email: {email}\n"
            "Contact Number: {phone}\n"
            "Preferred Demo Date: {date}"
        ),
    }


@router.post("", status_code=201)
async def create_lead_from_form(req: CreateLeadRequest):
    """
    Direct endpoint called when visitor submits the mobile demo request web form on their phone.
    """
    clean_phone = clean_phone_number(req.contact_number)
    
    lead_doc = {
        "whatsapp_number": clean_phone or req.contact_number.strip(),
        "name": req.name.strip(),
        "company": req.company.strip(),
        "email": req.email.strip(),
        "contact_number": clean_phone or req.contact_number.strip(),
        "industry": req.industry.strip(),
        "challenge": "Personalized Demo Request",
        "preferred_date": req.preferred_date.strip() if req.preferred_date else "Flexible",
        "raw_message": f"Submitted via Mobile Demo Form | Industry: {req.industry.strip()}",
        "status": "New",
    }

    saved = await insert_or_deduplicate_lead(lead_doc)
    logger.info("[Leads API] Captured lead via mobile form: %s (%s)", req.name, req.company)
    return {
        "success": True,
        "lead": saved,
    }


@router.get("")
async def list_leads(
    status: Optional[str] = Query(None, description="Filter by status (New, Contacted, Demo Scheduled, Demo Completed, Follow-up)"),
    industry: Optional[str] = Query(None, description="Filter by industry name"),
    search: Optional[str] = Query(None, description="Search keyword across name, company, email, phone, challenge"),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
):
    """
    List captured leads with optional filtering and search.
    """
    leads = await get_all_leads(
        status=status,
        industry=industry,
        search=search,
        skip=skip,
        limit=limit,
    )
    return {
        "leads": leads,
        "count": len(leads),
    }


@router.get("/stats")
async def lead_statistics():
    """
    KPI summary statistics for the Admin Dashboard.
    """
    return await get_lead_stats()


@router.patch("/{lead_id}")
async def change_lead_status(lead_id: str, req: StatusUpdateRequest):
    """
    Update lead status (New, Contacted, Demo Scheduled, Demo Completed, Follow-up) and internal notes.
    """
    try:
        updated = await update_lead_status(lead_id=lead_id, new_status=req.status, notes=req.notes)
        if not updated:
            raise HTTPException(status_code=404, detail=f"Lead with ID '{lead_id}' not found.")
        return {
            "success": True,
            "lead": updated,
        }
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))


@router.post("/simulate")
async def simulate_incoming_lead(req: SimulateLeadRequest):
    """
    Simulates an incoming WhatsApp lead submission for testing and kiosk validation.
    """
    raw_message = (
        f"Hi! I experienced the Zeno demo at your event and would like to request a personalized demo.\n\n"
        f"Industry: {req.industry}\n\n"
        f"Name: {req.name}\n"
        f"Company: {req.company}\n"
        f"Work Email: {req.email}\n"
        f"Contact Number: {req.contact_number}\n"
        f"Preferred Demo Date: {req.preferred_date}"
    )

    lead_doc = {
        "whatsapp_number": req.contact_number,
        "name": req.name,
        "company": req.company,
        "email": req.email,
        "contact_number": req.contact_number,
        "industry": req.industry,
        "challenge": req.challenge or "Personalized Demo Request",
        "preferred_date": req.preferred_date,
        "raw_message": raw_message,
        "status": "New",
    }

    saved = await insert_or_deduplicate_lead(lead_doc)
    return {
        "success": True,
        "simulated_lead": saved,
    }
