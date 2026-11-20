import json
import logging
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).resolve().parents[2] / "zeno_sme.db"


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    Initialize SQLite database tables for SMEs and connection requests.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # SMEs Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS smes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                designation TEXT NOT NULL,
                expertise TEXT NOT NULL,
                supported_industries TEXT NOT NULL,
                notification_email TEXT NOT NULL,
                notification_whatsapp TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL
            )
        """)

        # Auto-migration: check if notification_whatsapp column exists
        cursor.execute("PRAGMA table_info(smes)")
        columns = [row[1] for row in cursor.fetchall()]
        if "notification_whatsapp" not in columns:
            cursor.execute("ALTER TABLE smes ADD COLUMN notification_whatsapp TEXT")
            logger.info("Migrated smes table: added notification_whatsapp column.")

        # Update default WhatsApp numbers if empty
        cursor.execute("UPDATE smes SET notification_whatsapp = ? WHERE id = 'sme_001' AND (notification_whatsapp IS NULL OR notification_whatsapp = '')", (os.getenv("SME_WHATSAPP_RAJESH", "+919810012345"),))
        cursor.execute("UPDATE smes SET notification_whatsapp = ? WHERE id = 'sme_002' AND (notification_whatsapp IS NULL OR notification_whatsapp = '')", (os.getenv("SME_WHATSAPP_PRIYA", "+919820012345"),))
        cursor.execute("UPDATE smes SET notification_whatsapp = ? WHERE id = 'sme_003' AND (notification_whatsapp IS NULL OR notification_whatsapp = '')", (os.getenv("SME_WHATSAPP_AMIT", "+919830012345"),))
        cursor.execute("UPDATE smes SET notification_whatsapp = ? WHERE id = 'sme_004' AND (notification_whatsapp IS NULL OR notification_whatsapp = '')", (os.getenv("SME_WHATSAPP_SNEHA", "+919840012345"),))
        cursor.execute("UPDATE smes SET notification_whatsapp = ? WHERE id = 'sme_005' AND (notification_whatsapp IS NULL OR notification_whatsapp = '')", (os.getenv("SME_WHATSAPP_VIKRAM", "+919850012345"),))
        cursor.execute("UPDATE smes SET notification_whatsapp = ? WHERE id = 'sme_006'", (os.getenv("SME_WHATSAPP_JAYANTH", "+919342160653"),))

        # Ensure sample SME Jayanth (sme_006) exists and is updated with WhatsApp number
        now_ts = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
            INSERT INTO smes (id, name, designation, expertise, supported_industries, notification_email, notification_whatsapp, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                designation = excluded.designation,
                expertise = excluded.expertise,
                supported_industries = excluded.supported_industries,
                notification_whatsapp = excluded.notification_whatsapp,
                is_active = excluded.is_active
        """, (
            "sme_006",
            "Jayanth",
            "Solutions Architect & AI Consultant",
            "Conversational AI, Netcore Agentic Platform & Enterprise Customer Engagement",
            json.dumps(["All", "Banking & Financial Services", "Retail & E-commerce", "Telecommunications", "Travel & Hospitality", "Healthcare", "Education", "Media & Entertainment", "Insurance", "Other"]),
            os.getenv("SME_EMAIL_JAYANTH", "jayanth.sme@netcorecloud.com"),
            os.getenv("SME_WHATSAPP_JAYANTH", "+919342160653"),
            1,
            now_ts,
        ))

        # SME Connection Requests Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sme_connection_requests (
                id TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                industry TEXT NOT NULL,
                sme_id TEXT NOT NULL,
                connection_preference TEXT NOT NULL,
                consent INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'pending',
                notification_status TEXT NOT NULL DEFAULT 'pending',
                created_at TEXT NOT NULL,
                notified_at TEXT,
                preferred_date_time TEXT,
                business_requirement TEXT,
                FOREIGN KEY (sme_id) REFERENCES smes(id)
            )
        """)

        # Auto-migration for existing database: add preferred_date_time and business_requirement columns
        cursor.execute("PRAGMA table_info(sme_connection_requests)")
        req_columns = [row[1] for row in cursor.fetchall()]
        if "preferred_date_time" not in req_columns:
            cursor.execute("ALTER TABLE sme_connection_requests ADD COLUMN preferred_date_time TEXT")
            logger.info("Migrated sme_connection_requests: added preferred_date_time column.")
        if "business_requirement" not in req_columns:
            cursor.execute("ALTER TABLE sme_connection_requests ADD COLUMN business_requirement TEXT")
            logger.info("Migrated sme_connection_requests: added business_requirement column.")

        conn.commit()
        
        # Seed initial SMEs if table is empty
        cursor.execute("SELECT COUNT(*) FROM smes")
        count = cursor.fetchone()[0]
        if count == 0:
            seed_initial_smes(cursor)
            conn.commit()
            logger.info("Seeded initial Netcore event SMEs into database.")
    except Exception as e:
        logger.exception("Failed to initialize database: %s", e)
        raise
    finally:
        conn.close()


def seed_initial_smes(cursor: sqlite3.Cursor):
    now = datetime.now(timezone.utc).isoformat()
    smes_data = [
        (
            "sme_001",
            "Rajesh Nair",
            "VP – AI & Agentic Marketing Solutions",
            "Autonomous AI Marketing Agents, Enterprise MarTech Architecture & Agent Collaboration",
            json.dumps(["All", "Banking & Financial Services", "Retail & E-commerce", "Telecommunications", "Other"]),
            os.getenv("SME_EMAIL_RAJESH", "rajesh.nair.zeno@example.com"),
            os.getenv("SME_WHATSAPP_RAJESH", "+919810012345"),
            1,
            now,
        ),
        (
            "sme_002",
            "Priya Sharma",
            "Principal Solution Architect – BFSI & Fintech",
            "Customer Engagement, Predictive Churn Modeling & Hyper-Personalized Financial Products",
            json.dumps(["Banking & Financial Services", "Insurance"]),
            os.getenv("SME_EMAIL_PRIYA", "priya.sharma.zeno@example.com"),
            os.getenv("SME_WHATSAPP_PRIYA", "+919820012345"),
            1,
            now,
        ),
        (
            "sme_003",
            "Amit Verma",
            "Director – Retail & E-commerce Strategy",
            "Conversational Commerce, Cart Abandonment Recovery & Real-Time Product Recommendations",
            json.dumps(["Retail & E-commerce"]),
            os.getenv("SME_EMAIL_AMIT", "amit.verma.zeno@example.com"),
            os.getenv("SME_WHATSAPP_AMIT", "+919830012345"),
            1,
            now,
        ),
        (
            "sme_004",
            "Sneha Kulkarni",
            "Enterprise Lead – Telecom & Media",
            "Subscriber Retention, Digital Onboarding Automation & AI Customer Experience",
            json.dumps(["Telecommunications", "Media & Entertainment"]),
            os.getenv("SME_EMAIL_SNEHA", "sneha.kulkarni.zeno@example.com"),
            os.getenv("SME_WHATSAPP_SNEHA", "+919840012345"),
            1,
            now,
        ),
        (
            "sme_005",
            "Vikram Patel",
            "Strategic Growth Advisor – Travel & Healthcare",
            "Guest Experience Automation, Patient Communication Journeys & Higher-Ed Admissions",
            json.dumps(["Travel & Hospitality", "Healthcare", "Education"]),
            os.getenv("SME_EMAIL_VIKRAM", "vikram.patel.zeno@example.com"),
            os.getenv("SME_WHATSAPP_VIKRAM", "+919850012345"),
            1,
            now,
        ),
        (
            "sme_006",
            "Jayanth",
            "Solutions Architect & AI Consultant",
            "Conversational AI, Netcore Agentic Platform & Enterprise Customer Engagement",
            json.dumps(["All", "Banking & Financial Services", "Retail & E-commerce", "Telecommunications", "Travel & Hospitality", "Healthcare", "Education", "Media & Entertainment", "Insurance", "Other"]),
            os.getenv("SME_EMAIL_JAYANTH", "jayanth.sme@netcorecloud.com"),
            os.getenv("SME_WHATSAPP_JAYANTH", "+919342160653"),
            1,
            now,
        ),
    ]

    cursor.executemany("""
        INSERT INTO smes (id, name, designation, expertise, supported_industries, notification_email, notification_whatsapp, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, smes_data)


def get_active_smes() -> List[Dict[str, Any]]:
    """
    Get active SMEs without exposing notification email addresses.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, designation, expertise, supported_industries, is_active, created_at
            FROM smes
            WHERE is_active = 1
            ORDER BY name ASC
        """)
        rows = cursor.fetchall()
        smes = []
        for r in rows:
            industries = []
            try:
                industries = json.loads(r["supported_industries"])
            except Exception:
                industries = [r["supported_industries"]]
                
            smes.append({
                "id": r["id"],
                "name": r["name"],
                "designation": r["designation"],
                "expertise": r["expertise"],
                "supported_industries": industries,
                "is_active": bool(r["is_active"]),
                "created_at": r["created_at"],
            })
        return smes
    finally:
        conn.close()


def get_sme_by_id(sme_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve full SME record including notification destinations (backend only).
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM smes WHERE id = ?", (sme_id,))
        row = cursor.fetchone()
        if not row:
            return None
        industries = []
        try:
            industries = json.loads(row["supported_industries"])
        except Exception:
            industries = [row["supported_industries"]]
        return {
            "id": row["id"],
            "name": row["name"],
            "designation": row["designation"],
            "expertise": row["expertise"],
            "supported_industries": industries,
            "notification_email": row["notification_email"],
            "notification_whatsapp": row["notification_whatsapp"] if "notification_whatsapp" in row.keys() else None,
            "is_active": bool(row["is_active"]),
            "created_at": row["created_at"],
        }
    finally:
        conn.close()


def create_connection_request(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Insert a connection request into the database.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        request_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        
        cursor.execute("""
            INSERT INTO sme_connection_requests (
                id, full_name, email, phone, industry, sme_id,
                connection_preference, consent, status, notification_status,
                created_at, notified_at, preferred_date_time, business_requirement
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            request_id,
            data["full_name"],
            data["email"],
            data["phone"],
            data["industry"],
            data["sme_id"],
            data["connection_preference"],
            1 if data.get("consent", True) else 0,
            data.get("status", "pending"),
            data.get("notification_status", "pending"),
            created_at,
            data.get("notified_at"),
            data.get("preferred_date_time"),
            data.get("business_requirement"),
        ))
        conn.commit()
        
        return {
            "id": request_id,
            "full_name": data["full_name"],
            "email": data["email"],
            "phone": data["phone"],
            "industry": data["industry"],
            "sme_id": data["sme_id"],
            "connection_preference": data["connection_preference"],
            "consent": True,
            "status": data.get("status", "pending"),
            "notification_status": data.get("notification_status", "pending"),
            "created_at": created_at,
            "notified_at": data.get("notified_at"),
            "preferred_date_time": data.get("preferred_date_time"),
            "business_requirement": data.get("business_requirement"),
        }
    finally:
        conn.close()


def update_connection_request(
    request_id: str,
    status: str,
    notification_status: str,
    notified_at: Optional[str] = None
):
    """
    Update request status and notification status.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE sme_connection_requests
            SET status = ?, notification_status = ?, notified_at = ?
            WHERE id = ?
        """, (status, notification_status, notified_at, request_id))
        conn.commit()
    finally:
        conn.close()


def get_connection_request(request_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sme_connection_requests WHERE id = ?", (request_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return dict(row)
    finally:
        conn.close()


def find_recent_duplicate(email: str, sme_id: str, within_seconds: int = 15) -> bool:
    """
    Check if a matching connection request was submitted within the last N seconds.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT created_at FROM sme_connection_requests
            WHERE LOWER(email) = LOWER(?) AND sme_id = ?
            ORDER BY created_at DESC LIMIT 1
        """, (email.strip(), sme_id.strip()))
        row = cursor.fetchone()
        if not row:
            return False
        
        last_created_str = row["created_at"]
        last_dt = datetime.fromisoformat(last_created_str)
        now_dt = datetime.now(timezone.utc)
        diff = (now_dt - last_dt).total_seconds()
        return diff < within_seconds
    except Exception as e:
        logger.warning("Duplicate check failed: %s", e)
        return False
    finally:
        conn.close()

