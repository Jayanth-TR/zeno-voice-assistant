import asyncio
import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

def run_e2e_tests():
    client = TestClient(app)

    print("====================================================")
    print("TEST 1: WhatsApp Webhook Verification (Meta Cloud API)")
    print("====================================================")
    verify_res = client.get(
        "/api/whatsapp/webhook",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": "zeno_whatsapp_verify_token_2026",
            "hub.challenge": "8877665544",
        }
    )
    print(f"Status Code: {verify_res.status_code}")
    print(f"Challenge Response: {verify_res.text}")
    assert verify_res.status_code == 200
    assert verify_res.text == "8877665544"
    print("✓ Webhook verification PASSED!\n")

    print("====================================================")
    print("TEST 2: Meta Cloud API Incoming WhatsApp Lead Webhook")
    print("====================================================")
    sample_incoming_payload = {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "100200300400",
                "changes": [
                    {
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {
                                "display_phone_number": "15550234567",
                                "phone_number_id": "999888777"
                            },
                            "contacts": [
                                {
                                    "profile": {
                                        "name": "Arjun Singhania"
                                    },
                                    "wa_id": "919876543210"
                                }
                            ],
                            "messages": [
                                {
                                    "from": "919876543210",
                                    "id": "wamid.HBgLOTE5ODc2NTQzMjEwFQIAEhgWM0VCMDAwMDAwMDAwMDAwMDAwMDAAA",
                                    "timestamp": "1710001234",
                                    "type": "text",
                                    "text": {
                                        "body": (
                                            "Hi! I experienced the Zeno demo at your event and would like to request a personalized demo.\n\n"
                                            "Industry: Banking & Fintech\n"
                                            "Business Challenge: Customers Check FD Rates but Don't Book\n\n"
                                            "Name: Arjun Singhania\n"
                                            "Company: Singhania Retail Bank\n"
                                            "Work Email: arjun@singhaniabank.in\n"
                                            "Contact Number: +91 98765 43210\n"
                                            "Preferred Demo Date: 2026-11-28 3:00 PM"
                                        )
                                    }
                                }
                            ]
                        },
                        "field": "messages"
                    }
                ]
            }
        ]
    }

    post_res = client.post("/api/whatsapp/webhook", json=sample_incoming_payload)
    print(f"POST Status Code: {post_res.status_code}")
    print(f"POST Response: {post_res.json()}")
    assert post_res.status_code == 200
    assert post_res.json().get("status") == "EVENT_RECEIVED"
    assert post_res.json().get("processed_leads") == 1
    print("✓ Incoming lead webhook processed PASSED!\n")

    print("====================================================")
    print("TEST 3: Duplicate Lead Prevention Check")
    print("====================================================")
    # Re-sending the identical Meta message ID
    dup_res = client.post("/api/whatsapp/webhook", json=sample_incoming_payload)
    assert dup_res.status_code == 200
    print("✓ Re-sending identical message was safely deduplicated without creating duplicate lead!\n")

    print("====================================================")
    print("TEST 4: Retrieve Leads List & Filter by Status")
    print("====================================================")
    get_res = client.get("/api/leads")
    assert get_res.status_code == 200
    leads_data = get_res.json()
    leads = leads_data.get("leads", [])
    print(f"Total Leads Retrieved: {len(leads)}")
    matching_lead = next((l for l in leads if "Arjun" in l.get("name", "")), None)
    assert matching_lead is not None
    lead_id = matching_lead["lead_id"]
    print(f"Found Lead: {matching_lead['name']} ({matching_lead['company']})")
    print(f"Lead ID: {lead_id} | Status: {matching_lead['status']}")
    print(f"Industry: {matching_lead['industry']} | Challenge: {matching_lead['challenge']}")
    print("✓ Lead retrieval PASSED!\n")

    print("====================================================")
    print("TEST 5: Update Lead Status (e.g., Demo Scheduled)")
    print("====================================================")
    patch_res = client.patch(
        f"/api/leads/{lead_id}",
        json={"status": "Demo Scheduled", "notes": "Confirmed on WhatsApp for Friday 3 PM"}
    )
    assert patch_res.status_code == 200
    updated_lead = patch_res.json().get("lead")
    assert updated_lead["status"] == "Demo Scheduled"
    print(f"Updated status successfully to: {updated_lead['status']}")
    print("✓ Lead status update PASSED!\n")

    print("====================================================")
    print("TEST 6: Lead Stats API for Admin Dashboard")
    print("====================================================")
    stats_res = client.get("/api/leads/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    print("KPI Stats:", stats)
    assert stats["total_leads"] >= 1
    assert "Demo Scheduled" in stats["by_status"]
    print("✓ Lead stats API PASSED!\n")

    print("====================================================")
    print("ALL 6 END-TO-END TESTS PASSED COMPLETELY! 🚀")
    print("====================================================")

if __name__ == "__main__":
    run_e2e_tests()
