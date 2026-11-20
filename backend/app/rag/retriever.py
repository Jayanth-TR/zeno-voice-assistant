# backend/app/rag/retriever.py

import logging
import re
import os
# Respect offline mode if explicitly set by environment, otherwise allow downloading embeddings if not cached
hf_offline = os.getenv("HF_HUB_OFFLINE")
if hf_offline is not None:
    os.environ["HF_HUB_OFFLINE"] = hf_offline

tf_offline = os.getenv("TRANSFORMERS_OFFLINE")
if tf_offline is not None:
    os.environ["TRANSFORMERS_OFFLINE"] = tf_offline

import math
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Optional

import chromadb
from sentence_transformers import SentenceTransformer


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]
VECTOR_DIR = BASE_DIR / "vector_store"

COLLECTION_NAME = "netcore_knowledge"
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

DEFAULT_TOP_K = 8
MIN_HYBRID_SCORE = 0.25

SEMANTIC_WEIGHT = 0.65
KEYWORD_WEIGHT = 0.35

logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# ChromaDB and embedding model
# ---------------------------------------------------------

client = chromadb.PersistentClient(path=str(VECTOR_DIR))

collection = client.get_or_create_collection(
    name=COLLECTION_NAME,
    metadata={"hnsw:space": "cosine"}
)

embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)

logger.info("Embedding model loaded successfully.")
logger.info("ChromaDB collection: %s", COLLECTION_NAME)
logger.info("Total chunks: %s", collection.count())


# ---------------------------------------------------------
# Automatic topic detection
# ---------------------------------------------------------

TOPIC_RULES = {
    "company_overview": [

        "about netcore",
        "what is netcore",
        "company overview",
        "company background",
        "company history",
        "founder",
        "founded",
        "leadership",
        "headquarters",
        "company profile",
        "business overview",
    ],

    "ai_agents": [
        "ai agent",
        "ai agents",
        "agent",
        "agents",
        "agentic ai",
        "decisioning agent",
        "scheduler agent",
        "shopping agent",
        "content agent",
        "insight agent",
        "audience agent",
        "agent capabilities",
        "agent functionality",
        "six agents",
        "seven agents",
        "available agents",
        "co-marketer",
        "how agents work together",
        "how do agents work together",
        "insights agent",
    ],

    "customer_success": [
        "customer success",
        "case study",
        "case studies",
        "customer story",
        "customer stories",
        "crocs",
        "anveshan",
        "igp",
        "roi",
        "return on investment",
        "business results",
        "measurable results",
        "customer results",
        "success story",
    ],

    "security_and_compliance": [
        "security",
        "compliance",
        "data privacy",
        "data protection",
        "gdpr",
        "dpdp",
        "iso",
        "certification",
        "certifications",
        "encryption",
        "authentication",
        "authorization",
        "access control",
        "data retention",
    ],

    "channels_and_integrations": [
        "channels",
        "channel",
        "integrations",
        "integration",
        "whatsapp",
        "email",
        "sms",
        "push notification",
        "web push",
        "mobile push",
        "website",
        "mobile app",
        "api",
        "third party",
    ],

    "products_and_solutions": [
        "product ecosystem",
        "platform capabilities",
        "customer data platform",
        "cdp",
        "customer profiles",
        "commerce search",
        "product discovery",
        "unbxd",
        "recommendations engine",
        "marketing technology solutions",
    ],

    "agentic_marketing": [
        "agentic marketing",
        "agentic growth",
        "autonomous marketing",
        "marketing automation",
        "marketing strategy",
        "growth marketing",
        "ai marketing",
        "marketing intelligence",
    ],

    "industry_ecommerce": [
        "e-commerce",
        "ecommerce",
        "retail",
        "d2c",
        "cart recovery",
        "abandoned cart",
        "abandoned carts",
        "abandonment",
        "checkout drop-off",
        "repeat buyers",
        "repeat purchases",
        "repeat purchase",
        "first-time buyers",
        "sale planning",
        "sale campaign",
        "sale campaigns",
        "discount fatigue",
        "morning reminder",
        "mulmul",
        "bighaat",
        "bacca bucci",
        "crocs",
        "igp",
        "gmv",
        "replenishment",
    ],

    "industry_banking": [
        "banking",
        "fintech",
        "bfsi",
        "financial services",
        "fixed deposit",
        "fixed deposits",
        "fd conversion",
        "fd conversions",
        "term deposit",
        "savings account",
        "savings balance",
        "salary credit",
        "surplus balance",
        "journey drop-offs",
        "journey drop-off",
        "journey dropoff",
        "loan application",
        "loan drop-off",
        "kyc drop-off",
        "kyc upload",
        "dormancy",
        "dormant accounts",
        "dormant account",
        "inactive customers",
        "customer reactivation",
        "account reactivation",
        "equitas",
        "equitas bank",
        "shriram",
        "shriram finance",
        "cleartax",
    ],

    "industry_insurance": [
        "insurance",
        "policy renewal",
        "policy renewals",
        "renewal rate",
        "timely renewals",
        "timely renewal",
        "policy lapse",
        "lapse prevention",
        "grace period",
        "cross-selling",
        "cross-sell",
        "cross sell",
        "second policy",
        "policyholders",
        "policyholder",
        "term insurance",
        "health insurance",
        "motor insurance",
        "campaign roi",
        "channel spend",
        "sms fatigue",
        "icici",
        "icici prudential",
        "icici life",
    ],

    "netcore_booth": [
        "booth",
        "booth knowledge",
        "experience center",
        "netcore overview",
        "netcore scale",
        "35 billion",
        "35b emails",
        "gartner",
        "forrester",
        "magic quadrant",
        "agent hub",
        "custom ai agents",
        "six ai agents",
        "custom agents",
        "g2",
        "email deliverability",
    ],
}


TOPIC_EXPANSIONS = {
    "company_overview": (
        "Netcore company profile background history "
        "business overview company information"
    ),

    "ai_agents": (
        "Netcore AI agents six publicly named agents "
        "Audience Agent Content Agent Scheduler Agent "
        "Insights Agent Decisioning Agent Shopping Agent "
        "agent summary individual agent descriptions capabilities FAQs "
        "collaboration how agents work together workflow"
    ),

    "customer_success": (
        "Netcore customer case studies customer success "
        "business outcomes measurable results ROI"
    ),

    "security_and_compliance": (
        "Netcore security privacy compliance data protection "
        "encryption certifications regulatory requirements"
    ),

    "channels_and_integrations": (
        "Netcore communication channels integrations "
        "WhatsApp email SMS push notifications APIs"
    ),

    "products_and_solutions": (
        "Netcore products solutions platform capabilities "
        "customer engagement marketing technology"
    ),

    "agentic_marketing": (
        "Netcore agentic marketing autonomous AI marketing "
        "AI-driven growth and customer engagement"
    ),

    "industry_ecommerce": (
        "Netcore E-commerce D2C retail cart recovery repeat buyer conversion "
        "sale planning abandoned carts discount fatigue Mulmul BigHaat Bacca Bucci "
        "morning reminder timing customer segments ₹21L/month recovered"
    ),

    "industry_banking": (
        "Netcore Banking Fintech BFSI fixed deposit FD conversions journey drop-offs "
        "loan application audit dormant account reactivation Equitas Small Finance Bank "
        "Shriram Finance ClearTax KYC drop-off recovery salary credit surplus balance"
    ),

    "industry_insurance": (
        "Netcore Insurance policy renewals timely renewal cross-selling campaign ROI "
        "SMS spend reduction WhatsApp payments ICICI Prudential Life Insurance "
        "grace period tiered reminder schedule lifecycle milestones"
    ),

    "netcore_booth": (
        "Netcore booth knowledge base experience center company scale 35 billion emails "
        "Gartner Forrester Agent Hub custom AI agents six agents proof points"
    ),
}


# ---------------------------------------------------------
# Keyword utilities
# ---------------------------------------------------------

STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were",
    "what", "which", "who", "where", "when", "why",
    "how", "does", "do", "did", "can", "could",
    "would", "should", "will", "has", "have", "had",
    "and", "or", "but", "to", "of", "in", "on",
    "for", "from", "with", "by", "about", "into",
    "me", "my", "we", "our", "you", "your",
    "it", "its", "this", "that", "these", "those",
    "all", "list", "show", "tell", "explain",
    "give", "provide", "different", "various",
    "uploaded", "upload", "pdf", "document",
    "documents", "say", "says", "mentioned",
}


ENUMERATION_PATTERNS = [
    r"\ball\b",
    r"\blist\b",
    r"\blist out\b",
    r"\bwhat are the different\b",
    r"\bwhat are all\b",
    r"\bwhat are the\b",
    r"\bwhich are the\b",
    r"\bwhich .* agents\b",
    r"\bhow many\b",
    r"\btypes of\b",
    r"\bcategories of\b",
    r"\bdifferent types\b",
    r"\bname the\b",
    r"\benumerate\b",
]


def tokenize(text: str) -> List[str]:
    """Normalize text and return meaningful tokens."""

    if not text:
        return []

    tokens = re.findall(r"[a-zA-Z0-9]+", text.lower())

    return [
        token
        for token in tokens
        if token not in STOPWORDS and len(token) > 1
    ]


# ---------------------------------------------------------
# Topic detection
# ---------------------------------------------------------

def is_agent_related_query(query: str) -> bool:
    """Identify questions asking about Netcore's AI agents."""
    q = query.lower()
    patterns = [
        r"\bagents?\b",
        r"\baudience agent\b",
        r"\bcontent agent\b",
        r"\bscheduler agent\b",
        r"\binsights? agent\b",
        r"\bdecisioning agent\b",
        r"\bshopping agent\b",
        r"\bco-?marketer\b",
        r"\bsix agents\b",
        r"\bseven agents\b",
        r"\bhow many agents\b",
        r"\bavailable agents\b",
    ]
    return any(re.search(pat, q) for pat in patterns)


def detect_topics(query: str) -> List[str]:
    """
    Automatically identify relevant knowledge-base topics.

    Returns an empty list when no topic is detected.
    """

    query_lower = query.lower()
    detected_topics = []

    agent_query = is_agent_related_query(query)

    for topic, keywords in TOPIC_RULES.items():
        # Prevent company overview from triggering on agent queries unless explicit company history/leadership terms appear
        if agent_query and topic == "company_overview":
            explicit_company_terms = ["history", "founder", "founded", "headquarters", "leadership"]
            if not any(term in query_lower for term in explicit_company_terms):
                continue

        for keyword in keywords:
            if keyword.lower() in query_lower:
                detected_topics.append(topic)
                break

    if agent_query and "ai_agents" not in detected_topics:
        detected_topics.append("ai_agents")

    return detected_topics


def expand_query(query: str, topics: List[str]) -> str:
    """Expand the query using detected topic descriptions."""

    expansions = [
        TOPIC_EXPANSIONS[topic]
        for topic in topics
        if topic in TOPIC_EXPANSIONS
    ]

    if not expansions:
        return query

    return f"{query} {' '.join(expansions)}"


# ---------------------------------------------------------
# Enumeration detection
# ---------------------------------------------------------

def is_enumeration_query(query: str) -> bool:
    """Identify questions that require lists or multiple results."""

    query_lower = query.lower()

    return any(
        re.search(pattern, query_lower)
        for pattern in ENUMERATION_PATTERNS
    )


# ---------------------------------------------------------
# Keyword scoring
# ---------------------------------------------------------

def calculate_keyword_scores(
    query: str,
    documents: List[str]
) -> List[float]:
    """
    Calculate query-term coverage using IDF weighting.

    Scores are between 0 and 1.
    Repeated occurrences of a common query word
    cannot dominate the ranking.
    """

    query_tokens = list(set(tokenize(query)))

    if not query_tokens or not documents:
        return [0.0] * len(documents)

    document_tokens = [
        set(tokenize(document))
        for document in documents
    ]

    total_documents = len(document_tokens)

    # Calculate document frequency for each term.
    document_frequency = Counter()

    for tokens in document_tokens:
        document_frequency.update(tokens)

    # Calculate IDF weights for query terms.
    term_weights = {}

    for token in query_tokens:
        df = document_frequency.get(token, 0)

        term_weights[token] = (
            1 + math.log(
                (total_documents + 1) / (df + 1)
            )
        )

    total_weight = sum(term_weights.values())

    if total_weight == 0:
        return [0.0] * len(documents)

    scores = []

    for tokens in document_tokens:

        matched_weight = sum(
            weight
            for token, weight in term_weights.items()
            if token in tokens
        )

        score = matched_weight / total_weight

        scores.append(round(score, 4))

    return scores

# ---------------------------------------------------------
# ChromaDB query helper
# ---------------------------------------------------------

def query_collection(
    query_embedding: List[float],
    where: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Query ChromaDB using a metadata filter.

    The function retrieves all matching chunks for accurate
    ranking within the filtered result set.
    """

    try:
        total = collection.count()
    except Exception:
        logger.exception("Unable to count filtered ChromaDB records.")
        raise

    if total == 0:
        return []

    try:
        response = collection.query(
            query_embeddings=[query_embedding],
            n_results=total,
            where=where,
            include=[
                "documents",
                "metadatas",
                "distances",
            ],
        )

    except Exception:
        logger.exception("ChromaDB query failed.")
        raise

    results = []

    ids = response.get("ids", [[]])[0]
    # pyrefly: ignore[unsupported-operation]
    documents = response.get("documents", [[]])[0]
    # pyrefly: ignore[unsupported-operation]
    metadatas = response.get("metadatas", [[]])[0]
    # pyrefly: ignore[unsupported-operation]
    distances = response.get("distances", [[]])[0]

    for index, document in enumerate(documents):

        metadata = metadatas[index] or {}

        distance = (
            distances[index]
            if index < len(distances)
            and distances[index] is not None
            else 1.0
        )

        # ChromaDB cosine distance = 1 - cosine similarity.
        similarity = max(0.0, min(1.0, 1.0 - float(distance)))

        results.append({
            "id": ids[index],
            "content": document,
            "metadata": metadata,
            "similarity": similarity,
        })

    return results


# ---------------------------------------------------------
# Metadata helpers
# ---------------------------------------------------------

def get_file_type(metadata: Dict[str, Any]) -> str:
    return metadata.get("file_type") or "knowledge_base"


def is_pdf_chunk(metadata: Dict[str, Any]) -> bool:
    return (
        metadata.get("file_type") == "pdf"
        or metadata.get("topic") == "uploaded_pdf"
    )


def get_topic(metadata: Dict[str, Any]) -> Optional[str]:
    return metadata.get("topic")


# ---------------------------------------------------------
# Main retrieval function
# ---------------------------------------------------------

def retrieve_knowledge(
    query: str,
    top_k: int = DEFAULT_TOP_K,
    min_hybrid_score: float = MIN_HYBRID_SCORE,
    workspace_id: str = "default",
    document_id: Optional[str] = None,
    industry: Optional[str] = None,
    challenge_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieve relevant chunks from:

    1. Global Markdown knowledge base (including Industry Experience Center & Booth data).
    2. Uploaded PDFs belonging to the requested workspace.

    Topic filtering applies to Markdown chunks with industry-aware expansion.
    Uploaded PDFs remain eligible regardless of detected topic.

    If document_id is supplied, retrieval is restricted to that
    uploaded PDF within the specified workspace.
    """

    if not query or not query.strip():
        return []

    if top_k < 1:
        return []

    query = query.strip()

    logger.info("Retrieval query: %s", query)
    logger.info("Workspace: %s | Industry: %s | Challenge: %s", workspace_id, industry, challenge_id)

    if document_id:
        logger.info("Document filter: %s", document_id)

    # -----------------------------------------------------
    # 1. Detect topics & Industry mapping
    # -----------------------------------------------------

    detected_topics = detect_topics(query)

    # Map explicit industry parameter to knowledge-base topics
    if industry:
        ind_str = industry.lower()
        if any(term in ind_str for term in ["ecommerce", "e-commerce", "retail", "d2c"]):
            if "industry_ecommerce" not in detected_topics:
                detected_topics.append("industry_ecommerce")
        elif any(term in ind_str for term in ["bank", "fintech", "bfsi", "financial"]):
            if "industry_banking" not in detected_topics:
                detected_topics.append("industry_banking")
        elif any(term in ind_str for term in ["insurance", "policy"]):
            if "industry_insurance" not in detected_topics:
                detected_topics.append("industry_insurance")

    # If an industry topic is present, ensure cross-cutting product, agent, and booth knowledge are accessible
    has_industry = any(t.startswith("industry_") for t in detected_topics)
    if has_industry:
        for common_t in ["ai_agents", "products_and_solutions", "customer_success", "netcore_booth"]:
            if common_t not in detected_topics:
                detected_topics.append(common_t)

    logger.info("Detected topics: %s", detected_topics)

    # -----------------------------------------------------
    # 2. Expand query
    # -----------------------------------------------------

    expanded_query = expand_query(query, detected_topics)

    # -----------------------------------------------------
    # 3. Generate query embedding
    # -----------------------------------------------------

    query_embedding = embedding_model.encode(
        expanded_query,
        convert_to_numpy=True,
    ).tolist()

    # -----------------------------------------------------
    # 4. Determine retrieval strategy
    # -----------------------------------------------------

    enumeration_query = is_enumeration_query(query)

    effective_top_k = (
        max(top_k, 15)
        if enumeration_query
        else top_k
    )

    logger.info(
        "Enumeration query: %s | Effective top_k: %s",
        enumeration_query,
        effective_top_k,
    )

    # -----------------------------------------------------
    # 5. Retrieve Markdown knowledge
    # -----------------------------------------------------

    markdown_results = []

    if not document_id:

        if detected_topics:
            markdown_filter = {
                "topic": {
                    "$in": detected_topics
                }
            }
        else:
            markdown_filter = {
                "topic": {
                    "$ne": "uploaded_pdf"
                }
            }

        try:
            markdown_results = query_collection(
                query_embedding=query_embedding,
                where=markdown_filter,
            )

        except Exception:
            logger.exception(
                "Markdown retrieval failed."
            )

    # -----------------------------------------------------
    # 6. Retrieve workspace-specific PDF chunks
    # -----------------------------------------------------

    pdf_filter_conditions = [
        {"topic": "uploaded_pdf"},
        {"workspace_id": workspace_id},
    ]

    if document_id:
        pdf_filter_conditions.append(
            {"document_id": document_id}
        )

    pdf_filter = {
        "$and": pdf_filter_conditions
    }

    try:
        pdf_results = query_collection(
            query_embedding=query_embedding,
            where=pdf_filter,
        )

    except Exception:
        logger.exception(
            "PDF retrieval failed for workspace %s",
            workspace_id,
        )
        pdf_results = []

    # -----------------------------------------------------
    # 7. Combine Markdown and PDF candidates
    # -----------------------------------------------------

    candidates = markdown_results + pdf_results

    # Deduplicate by ChromaDB record ID.
    unique_candidates = {}
    for candidate in candidates:
        unique_candidates[candidate["id"]] = candidate

    candidates = list(unique_candidates.values())

    if not candidates:
        logger.info("No retrieval candidates found.")
        return []

    # -----------------------------------------------------
    # 8. Calculate keyword scores
    # -----------------------------------------------------

    documents = [
        candidate["content"]
        for candidate in candidates
    ]

    keyword_scores = calculate_keyword_scores(
        query=query,
        documents=documents,
    )

    # -----------------------------------------------------
    # 9. Hybrid ranking
    # -----------------------------------------------------

    ranked_results = []

    for index, candidate in enumerate(candidates):

        metadata = candidate["metadata"]

        similarity = candidate["similarity"]
        keyword_score = keyword_scores[index]

        hybrid_score = (
            SEMANTIC_WEIGHT * similarity
            + KEYWORD_WEIGHT * keyword_score
        )

        # -------------------------------------------------
        # 10. Agent-specific prioritization & overview protection
        # -------------------------------------------------
        agent_query = is_agent_related_query(query)
        query_lower = query.lower()

        if agent_query:
            source_name = str(metadata.get("source", "")).lower()
            topic_name = str(metadata.get("topic", "")).lower()
            section_name = str(metadata.get("section", "")).lower()
            content_lower = candidate["content"].lower()

            # Prevent unrelated company overview chunks from dominating
            if "01_company_overview" in source_name or topic_name == "company_overview":
                hybrid_score -= 0.20

            # General agent overview / list / enumeration boost
            is_agent_list_query = any(
                p in query_lower for p in [
                    "six", "how many", "what are the agents", "available agents",
                    "explain the agents", "explain these", "list", "all", "what agents"
                ]
            )
            if is_agent_list_query:
                # Prioritize agent summary tables, agent list sections, and 6 vs 7 distinction
                if (
                    "agent summary" in section_name
                    or "agent summary" in content_lower
                    or "publicly named ai agents" in content_lower
                    or ("audience agent" in content_lower and "content agent" in content_lower and "scheduler agent" in content_lower)
                ):
                    hybrid_score += 0.16
                elif topic_name == "ai_agents" or "03_ai_agents" in source_name:
                    hybrid_score += 0.08

            # If query asks how many agents or count, strongly prioritize the official six agents summary
            is_count_query = any(c in query_lower for c in ["how many", "count", "number of", "six or seven", "six", "seven", "agents list"])
            if is_count_query:
                if (
                    "03_ai_agents" in source_name
                    or "agent summary" in content_lower
                    or "six specialised agents" in content_lower
                    or "publicly names six" in content_lower
                    or "six specialized agents" in content_lower
                ):
                    hybrid_score += 0.22

            # Specific agent matching: check if an individual agent was asked about
            specific_agents = [
                ("audience agent", ["audience agent", "audience"]),
                ("content agent", ["content agent", "creative"]),
                ("scheduler agent", ["scheduler agent", "scheduler", "timing"]),
                ("insight agent", ["insight agent", "insights agent"]),
                ("insights agent", ["insight agent", "insights agent"]),
                ("decisioning agent", ["decisioning agent", "decisioning"]),
                ("shopping agent", ["shopping agent", "conversational commerce"]),
            ]
            for agent_key, agent_terms in specific_agents:
                if agent_key in query_lower:
                    if any(term in section_name for term in agent_terms) or f"what does the {agent_key}" in content_lower:
                        hybrid_score += 0.22
                    elif any(term in content_lower[:300] for term in agent_terms):
                        hybrid_score += 0.12

            # Agent collaboration / workflow matching
            is_collab_query = any(
                w in query_lower for w in ["work together", "collaborate", "collaboration", "together", "relationship", "orchestration", "workflow"]
            )
            if is_collab_query:
                if (
                    "work together" in content_lower
                    or "how do the agents work together" in content_lower
                    or "sharing performance learnings" in content_lower
                    or "shared customer and business context" in content_lower
                ):
                    hybrid_score += 0.22

        # -------------------------------------------------
        # 10b. Industry Experience Center prioritization
        # -------------------------------------------------
        source_name = str(metadata.get("source", "")).lower()
        topic_name = str(metadata.get("topic", "")).lower()
        section_name = str(metadata.get("section", "")).lower()
        content_lower = candidate["content"].lower()

        # Prioritize matching industry documents
        matching_industry_chunk = False
        if "industry_ecommerce" in detected_topics and ("08_industry_experience_ecommerce" in source_name or topic_name == "industry_ecommerce"):
            matching_industry_chunk = True
        elif "industry_banking" in detected_topics and ("09_industry_experience_banking" in source_name or topic_name == "industry_banking"):
            matching_industry_chunk = True
        elif "industry_insurance" in detected_topics and ("10_industry_experience_insurance" in source_name or topic_name == "industry_insurance"):
            matching_industry_chunk = True

        if matching_industry_chunk:
            hybrid_score += 0.20

            # Match specific challenge context
            challenge_terms = {
                "cart_recovery": ["cart recovery", "abandoned cart", "abandonment", "mulmul", "bacca bucci"],
                "repeat_buyers": ["repeat buyers", "repeat purchases", "repeat purchase", "bighaat", "replenishment"],
                "sale_planning": ["sale planning", "sale campaign", "discount fatigue", "igp"],
                "fd_conversion": ["fd conversion", "fixed deposit", "salary credit", "equitas", "shriram"],
                "journey_audit": ["journey drop-off", "journey dropoff", "loan application", "kyc", "cleartax"],
                "dormancy_reactivation": ["dormancy", "dormant", "inactive", "reactivation"],
                "policy_renewals": ["policy renewal", "renewals", "timely renewal", "icici"],
                "cross_selling": ["cross-selling", "cross-sell", "second policy", "lifecycle"],
                "campaign_roi": ["campaign roi", "channel spend", "sms fatigue", "channel arbitration"],
            }

            matched_challenge = False
            if challenge_id and challenge_id in challenge_terms:
                if any(t in section_name or t in content_lower for t in challenge_terms[challenge_id]):
                    matched_challenge = True
            else:
                for cid, terms in challenge_terms.items():
                    if any(t in query_lower for t in terms):
                        if any(t in section_name or t in content_lower for t in terms):
                            matched_challenge = True
                            break

            if matched_challenge:
                hybrid_score += 0.15

        elif enumeration_query:
            section = str(
                metadata.get("section", "")
            ).lower()

            content = candidate["content"].lower()

            summary_indicators = [
                "summary",
                "overview",
                "all agents",
                "agent summary",
                "list of",
                "available agents",
                "product summary",
            ]

            if any(
                indicator in section or indicator in content[:500]
                for indicator in summary_indicators
            ):
                hybrid_score += 0.05

        hybrid_score = min(max(hybrid_score, 0.0), 1.0)

        if hybrid_score < min_hybrid_score:
            continue

        # -------------------------------------------------
        # 11. Build consistent retrieval response
        # -------------------------------------------------

        result = {
            "content": candidate["content"],

            "source": metadata.get("source"),

            "chunk_index": metadata.get("chunk_index"),

            "topic": metadata.get("topic"),

            "section": metadata.get("section"),

            "approval_status": metadata.get(
                "approval_status"
            ),

            "similarity": round(similarity, 4),

            "keyword_score": round(keyword_score, 4),

            "hybrid_score": round(hybrid_score, 4),

            "document_id": metadata.get("document_id"),

            "workspace_id": metadata.get("workspace_id"),

            "file_type": get_file_type(metadata),

            "page": metadata.get("page"),
        }

        ranked_results.append(result)

    # -----------------------------------------------------
    # 12. Sort by hybrid relevance
    # -----------------------------------------------------

    ranked_results.sort(
        key=lambda item: item["hybrid_score"],
        reverse=True,
    )

    final_results = ranked_results[:effective_top_k]

    logger.info(
        "Retrieved %s relevant chunks from %s candidates.",
        len(final_results),
        len(candidates),
    )

    for result in final_results:
        logger.info(
            "Source=%s | Page=%s | Type=%s | Score=%.4f",
            result["source"],
            result["page"],
            result["file_type"],
            result["hybrid_score"],
        )

    return final_results


# ---------------------------------------------------------
# Optional helper: retrieve from a specific PDF
# ---------------------------------------------------------

def retrieve_from_document(
    query: str,
    document_id: str,
    workspace_id: str = "default",
    top_k: int = DEFAULT_TOP_K,
) -> List[Dict[str, Any]]:
    """
    Convenience function to search within one uploaded PDF.
    """

    return retrieve_knowledge(
        query=query,
        top_k=top_k,
        workspace_id=workspace_id,
        document_id=document_id,
    )