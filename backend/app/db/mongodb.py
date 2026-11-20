import logging
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# MongoDB configuration: Enabled if MONGODB_URI is provided in environment, otherwise seamless SQLite fallback
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB", "zeno_sme_db")
LEADS_COLLECTION = "leads"

# SQLite fallback path
DB_PATH = Path(__file__).resolve().parents[2] / "zeno_sme.db"

# Global motor client instance
_motor_client = None
_motor_db = None
_use_mongo = False


def get_sqlite_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn


async def init_leads_db():
    """
    Initialize MongoDB leads collection and indexes.
    If MongoDB is unavailable, gracefully initializes local SQLite leads table.
    """
    global _motor_client, _motor_db, _use_mongo

    # 1. Initialize SQLite fallback table regardless so data is always secure
    try:
        conn = get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS zeno_leads (
                lead_id TEXT PRIMARY KEY,
                whatsapp_number TEXT NOT NULL,
                name TEXT,
                company TEXT,
                email TEXT,
                contact_number TEXT,
                industry TEXT NOT NULL,
                challenge TEXT NOT NULL,
                preferred_date TEXT,
                raw_message TEXT,
                status TEXT NOT NULL DEFAULT 'New',
                request_date TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                wa_message_id TEXT,
                notes TEXT
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_leads_wa_num ON zeno_leads(whatsapp_number)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_leads_status ON zeno_leads(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_leads_req_date ON zeno_leads(request_date)")
        conn.commit()
        conn.close()
        logger.info("[Leads DB] SQLite leads table initialized at %s", DB_PATH)
    except Exception as e:
        logger.warning("[Leads DB] Failed to init SQLite fallback leads table: %s", e)

    # 2. Attempt MongoDB connection via Motor if MONGODB_URI is provided
    if not MONGODB_URI:
        _use_mongo = False
        logger.info("[Leads DB] No MONGODB_URI specified. Operating with persistent SQLite leads database.")
        return

    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2500)
        # Ping the server to check connectivity
        await client.admin.command('ping')
        _motor_client = client
        _motor_db = client[MONGODB_DB_NAME]
        _use_mongo = True

        collection = _motor_db[LEADS_COLLECTION]
        # Create indexes
        await collection.create_index("lead_id", unique=True)
        await collection.create_index("whatsapp_number")
        await collection.create_index("status")
        await collection.create_index("request_date")
        await collection.create_index("wa_message_id", sparse=True)
        logger.info("[Leads DB] Successfully connected to MongoDB database '%s'", MONGODB_DB_NAME)
    except Exception as e:
        _use_mongo = False
        logger.info("[Leads DB] MongoDB not available (%s). Using local SQLite leads storage fallback.", e)


async def insert_or_deduplicate_lead(lead_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save lead to MongoDB (or fallback SQLite).
    Prevents duplicate entries:
      - Ignores if exact wa_message_id already exists.
      - If same whatsapp_number and challenge submitted within 24h, updates existing lead.
      - Otherwise, creates a new lead with status 'New'.
    """
    global _use_mongo, _motor_db

    wa_num = (lead_data.get("whatsapp_number") or "").strip()
    wa_msg_id = (lead_data.get("wa_message_id") or "").strip() or None
    challenge = (lead_data.get("challenge") or "").strip()
    now_iso = datetime.now(timezone.utc).isoformat()

    lead_id = lead_data.get("lead_id") or f"lead_{uuid.uuid4().hex[:12]}"
    status = lead_data.get("status") or "New"

    doc = {
        "lead_id": lead_id,
        "whatsapp_number": wa_num,
        "name": (lead_data.get("name") or "").strip() or "Visitor",
        "company": (lead_data.get("company") or "").strip() or "Not Specified",
        "email": (lead_data.get("email") or "").strip() or "Not Provided",
        "contact_number": (lead_data.get("contact_number") or wa_num or "").strip(),
        "industry": (lead_data.get("industry") or "General").strip(),
        "challenge": challenge or "General Exploration",
        "preferred_date": (lead_data.get("preferred_date") or "").strip() or "Flexible",
        "raw_message": lead_data.get("raw_message") or "",
        "status": status,
        "request_date": lead_data.get("request_date") or now_iso,
        "updated_at": now_iso,
        "wa_message_id": wa_msg_id,
        "notes": lead_data.get("notes") or "",
    }

    # Deduplication criteria: match by whatsapp_number, contact_number, or email
    filter_phone = wa_num or doc["contact_number"]
    filter_email = doc["email"] if doc["email"] not in ("Not Provided", "") else None

    if _use_mongo and _motor_db is not None:
        try:
            coll = _motor_db[LEADS_COLLECTION]
            # 1. Deduplicate by Meta wa_message_id if present
            if wa_msg_id:
                existing = await coll.find_one({"wa_message_id": wa_msg_id})
                if existing:
                    logger.info("[Leads DB] Duplicate WhatsApp message ID %s received. Skipping.", wa_msg_id)
                    existing["_id"] = str(existing.get("_id", ""))
                    return existing

            # 2. Deduplicate by phone or email within recent submissions
            or_conditions = []
            if filter_phone:
                or_conditions.append({"whatsapp_number": filter_phone})
                or_conditions.append({"contact_number": filter_phone})
            if filter_email:
                or_conditions.append({"email": filter_email})

            existing_recent = None
            if or_conditions:
                existing_recent = await coll.find_one(
                    {"$or": or_conditions},
                    sort=[("request_date", -1)]
                )

            if existing_recent:
                # Update existing lead with latest details & timestamp
                update_fields = {
                    "name": doc["name"] if doc["name"] != "Visitor" else existing_recent.get("name", "Visitor"),
                    "company": doc["company"] if doc["company"] != "Not Specified" else existing_recent.get("company"),
                    "email": doc["email"] if doc["email"] != "Not Provided" else existing_recent.get("email"),
                    "contact_number": doc["contact_number"] or existing_recent.get("contact_number"),
                    "industry": doc["industry"] if doc["industry"] != "General" else existing_recent.get("industry"),
                    "challenge": doc["challenge"],
                    "preferred_date": doc["preferred_date"] if doc["preferred_date"] != "Flexible" else existing_recent.get("preferred_date"),
                    "raw_message": doc["raw_message"] or existing_recent.get("raw_message", ""),
                    "updated_at": now_iso,
                }
                if wa_msg_id:
                    update_fields["wa_message_id"] = wa_msg_id

                await coll.update_one({"_id": existing_recent["_id"]}, {"$set": update_fields})
                existing_recent.update(update_fields)
                existing_recent["_id"] = str(existing_recent.get("_id", ""))
                logger.info("[Leads DB] Updated existing recent lead %s for %s", existing_recent["lead_id"], filter_phone or filter_email)
                return existing_recent

            # Insert brand new lead
            await coll.insert_one(doc)
            doc_copy = dict(doc)
            doc_copy["_id"] = str(doc_copy.get("_id", ""))
            logger.info("[Leads DB] Inserted new lead %s into MongoDB for %s", lead_id, filter_phone)
            return doc_copy
        except Exception as e:
            logger.warning("[Leads DB] MongoDB insert failed (%s). Falling back to SQLite.", e)

    # SQLite fallback
    conn = get_sqlite_conn()
    try:
        cursor = conn.cursor()
        if wa_msg_id:
            cursor.execute("SELECT * FROM zeno_leads WHERE wa_message_id = ?", (wa_msg_id,))
            row = cursor.fetchone()
            if row:
                logger.info("[Leads DB] SQLite duplicate message ID %s. Skipping.", wa_msg_id)
                return dict(row)

        cursor.execute(
            """
            SELECT * FROM zeno_leads 
            WHERE (whatsapp_number = ? AND whatsapp_number != '') 
               OR (contact_number = ? AND contact_number != '')
               OR (email = ? AND email != 'Not Provided' AND email != '')
            ORDER BY request_date DESC LIMIT 1
            """,
            (filter_phone, filter_phone, filter_email or "")
        )
        existing_row = cursor.fetchone()
        if existing_row:
            lead_id = existing_row["lead_id"]
            cursor.execute("""
                UPDATE zeno_leads
                SET name = ?, company = ?, email = ?, contact_number = ?, preferred_date = ?, raw_message = ?, updated_at = ?
                WHERE lead_id = ?
            """, (
                doc["name"] if doc["name"] != "Visitor" else existing_row["name"],
                doc["company"] if doc["company"] != "Not Specified" else existing_row["company"],
                doc["email"] if doc["email"] != "Not Provided" else existing_row["email"],
                doc["contact_number"],
                doc["preferred_date"] if doc["preferred_date"] != "Flexible" else existing_row["preferred_date"],
                doc["raw_message"],
                now_iso,
                lead_id
            ))
            conn.commit()
            cursor.execute("SELECT * FROM zeno_leads WHERE lead_id = ?", (lead_id,))
            return dict(cursor.fetchone())

        cursor.execute("""
            INSERT INTO zeno_leads (
                lead_id, whatsapp_number, name, company, email, contact_number,
                industry, challenge, preferred_date, raw_message, status,
                request_date, updated_at, wa_message_id, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doc["lead_id"], doc["whatsapp_number"], doc["name"], doc["company"], doc["email"],
            doc["contact_number"], doc["industry"], doc["challenge"], doc["preferred_date"],
            doc["raw_message"], doc["status"], doc["request_date"], doc["updated_at"],
            doc["wa_message_id"], doc["notes"]
        ))
        conn.commit()
        return doc
    finally:
        conn.close()


async def get_all_leads(
    status: Optional[str] = None,
    industry: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
) -> List[Dict[str, Any]]:
    """
    Retrieve leads list sorted by request_date DESC with optional filters.
    """
    global _use_mongo, _motor_db

    if _use_mongo and _motor_db is not None:
        try:
            coll = _motor_db[LEADS_COLLECTION]
            query: Dict[str, Any] = {}
            if status and status != "All":
                query["status"] = status
            if industry and industry != "All":
                query["industry"] = industry
            if search and search.strip():
                s = search.strip()
                query["$or"] = [
                    {"name": {"$regex": s, "$options": "i"}},
                    {"company": {"$regex": s, "$options": "i"}},
                    {"email": {"$regex": s, "$options": "i"}},
                    {"whatsapp_number": {"$regex": s, "$options": "i"}},
                    {"challenge": {"$regex": s, "$options": "i"}},
                ]

            cursor = coll.find(query).sort("request_date", -1).skip(skip).limit(limit)
            leads = []
            async for doc in cursor:
                doc["_id"] = str(doc.get("_id", ""))
                leads.append(doc)
            return leads
        except Exception as e:
            logger.warning("[Leads DB] MongoDB find failed (%s). Falling back to SQLite.", e)

    # SQLite fallback
    conn = get_sqlite_conn()
    try:
        cursor = conn.cursor()
        clauses = []
        params = []
        if status and status != "All":
            clauses.append("status = ?")
            params.append(status)
        if industry and industry != "All":
            clauses.append("industry = ?")
            params.append(industry)
        if search and search.strip():
            s = f"%{search.strip()}%"
            clauses.append("(name LIKE ? OR company LIKE ? OR email LIKE ? OR whatsapp_number LIKE ? OR challenge LIKE ?)")
            params.extend([s, s, s, s, s])

        where_sql = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        sql = f"SELECT * FROM zeno_leads {where_sql} ORDER BY request_date DESC LIMIT ? OFFSET ?"
        params.extend([limit, skip])

        cursor.execute(sql, params)
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


async def update_lead_status(lead_id: str, new_status: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Update lead status (New, Contacted, Demo Scheduled, Demo Completed, Follow-up).
    """
    global _use_mongo, _motor_db
    valid_statuses = {"New", "Contacted", "Demo Scheduled", "Demo Completed", "Follow-up"}
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status '{new_status}'. Allowed: {valid_statuses}")

    now_iso = datetime.now(timezone.utc).isoformat()

    if _use_mongo and _motor_db is not None:
        try:
            coll = _motor_db[LEADS_COLLECTION]
            update_data: Dict[str, Any] = {"status": new_status, "updated_at": now_iso}
            if notes is not None:
                update_data["notes"] = notes

            await coll.update_one({"lead_id": lead_id}, {"$set": update_data})
            updated = await coll.find_one({"lead_id": lead_id})
            if updated:
                updated["_id"] = str(updated.get("_id", ""))
                return updated
        except Exception as e:
            logger.warning("[Leads DB] MongoDB update failed (%s). Falling back to SQLite.", e)

    conn = get_sqlite_conn()
    try:
        cursor = conn.cursor()
        if notes is not None:
            cursor.execute(
                "UPDATE zeno_leads SET status = ?, notes = ?, updated_at = ? WHERE lead_id = ?",
                (new_status, notes, now_iso, lead_id)
            )
        else:
            cursor.execute(
                "UPDATE zeno_leads SET status = ?, updated_at = ? WHERE lead_id = ?",
                (new_status, now_iso, lead_id)
            )
        conn.commit()
        cursor.execute("SELECT * FROM zeno_leads WHERE lead_id = ?", (lead_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


async def get_lead_stats() -> Dict[str, Any]:
    """
    Compute KPI summary metrics for the Admin Dashboard.
    """
    leads = await get_all_leads(limit=2000)
    total = len(leads)
    by_status = {"New": 0, "Contacted": 0, "Demo Scheduled": 0, "Demo Completed": 0, "Follow-up": 0}
    by_industry: Dict[str, int] = {}

    for lead in leads:
        st = lead.get("status", "New")
        by_status[st] = by_status.get(st, 0) + 1

        ind = lead.get("industry", "Other")
        by_industry[ind] = by_industry.get(ind, 0) + 1

    return {
        "total_leads": total,
        "by_status": by_status,
        "by_industry": by_industry,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "storage_mode": "MongoDB" if _use_mongo else "SQLite (Fallback)",
    }
