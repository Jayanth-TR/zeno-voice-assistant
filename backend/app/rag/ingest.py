
import os
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

import logging
import re
from pathlib import Path

import chromadb
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[2]
KNOWLEDGE_DIR = BASE_DIR / "knowledge_base"
VECTOR_DIR = BASE_DIR / "vector_store"

COLLECTION_NAME = "netcore_knowledge"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

CHUNK_SIZE = 2800
CHUNK_OVERLAP = 250

client = chromadb.PersistentClient(path=str(VECTOR_DIR))
embedding_model = SentenceTransformer(EMBEDDING_MODEL)


def extract_text(file_path: Path) -> str:
    """Extract text from PDF, Markdown, or TXT files."""

    suffix = file_path.suffix.lower()

    if suffix == ".pdf":
        reader = PdfReader(str(file_path))

        return "\n\n".join(
            page.extract_text() or ""
            for page in reader.pages
        )

    if suffix in [".md", ".txt"]:
        return file_path.read_text(encoding="utf-8")

    return ""


def get_topic(source: str) -> str:
    """Identify the knowledge category from the filename."""

    filename = source.lower()

    topic_mapping = {
        "01_company_overview": "company_overview",
        "02_agentic_marketing": "agentic_marketing",
        "03_ai_agents": "ai_agents",
        "04_products_and_solutions": "products_and_solutions",
        "05_customer_success_stories": "customer_success",
        "06_channels_and_integrations": "channels_and_integrations",
        "07_security_and_compliance": "security_and_compliance",
        "08_industry_experience_ecommerce": "industry_ecommerce",
        "09_industry_experience_banking": "industry_banking",
        "10_industry_experience_insurance": "industry_insurance",
        "11_netcore_booth_knowledge_base": "netcore_booth",
    }

    for key, topic in topic_mapping.items():
        if key in filename:
            return topic

    return "general"


def get_approval_status(source: str) -> str:
    """
    Mark supplied Netcore reference material.
    Booth and Experience Center files are approved for booth use.
    """

    topic = get_topic(source)

    if topic in ("industry_ecommerce", "industry_banking", "industry_insurance", "netcore_booth"):
        return "client_approved"

    if topic == "general":
        return "source_reference"

    return "requires_validation"


def is_standalone_approval_note(content: str) -> bool:
    """
    Identify sections containing only a standalone approval note.

    This does not remove approval warnings embedded alongside
    actual factual content.
    """

    content = content.strip()

    if not content.startswith(">"):
        return False

    approval_markers = [
        "important approval note:",
        "source and approval note:",
        "critical approval note:",
    ]

    lowered = content.lower()

    return any(
        marker in lowered
        for marker in approval_markers
    )


def split_into_paragraphs(text: str) -> list[str]:
    """
    Split text into logical blocks while preserving Markdown tables.
    """

    lines = text.splitlines()

    blocks = []
    current = []
    in_table = False

    def flush():
        nonlocal current

        content = "\n".join(current).strip()

        if content:
            blocks.append(content)

        current = []

    for line in lines:
        stripped = line.strip()

        if not stripped:
            if not in_table:
                flush()
            elif current:
                current.append(line)

            continue

        is_table_line = stripped.startswith("|")

        if is_table_line:
            if not in_table:
                flush()

            in_table = True
            current.append(line)

        else:
            if in_table:
                flush()
                in_table = False

            current.append(line)

    flush()

    return blocks


def split_large_block(
    block: str,
    max_size: int,
) -> list[str]:
    """Split oversized content without dropping text."""

    if len(block) <= max_size:
        return [block]

    sentences = re.split(r"(?<=[.!?])\s+", block)

    chunks = []
    current = ""

    for sentence in sentences:
        if len(sentence) > max_size:
            if current:
                chunks.append(current.strip())
                current = ""

            for start in range(0, len(sentence), max_size):
                chunks.append(
                    sentence[start:start + max_size].strip()
                )

            continue

        candidate = f"{current} {sentence}".strip()

        if len(candidate) > max_size and current:
            chunks.append(current.strip())
            current = sentence
        else:
            current = candidate

    if current:
        chunks.append(current.strip())

    return chunks


def heading_aware_chunks(
    text: str,
    source: str,
    max_size: int = CHUNK_SIZE,
) -> list[dict]:
    """
    Split Markdown content by heading hierarchy and paragraphs.

    Every chunk retains its document and section context.
    """

    lines = text.splitlines()

    heading_stack = []
    sections = []
    current_section = []

    def flush_section():
        nonlocal current_section

        if current_section:
            sections.append({
                "heading_path": list(heading_stack),
                "content": "\n".join(current_section).strip(),
            })

        current_section = []

    # Identify Markdown sections.
    for line in lines:

        heading_match = re.match(
            r"^(#{1,6})\s+(.+?)\s*#*\s*$",
            line,
        )

        if heading_match:
            flush_section()

            level = len(heading_match.group(1))
            heading = heading_match.group(2).strip()

            heading_stack[:] = heading_stack[:level - 1]
            heading_stack.append(heading)

        else:
            current_section.append(line)

    flush_section()

    chunks = []

    topic = get_topic(source)
    approval_status = get_approval_status(source)

    for section in sections:

        section_content = section["content"].strip()

        # Skip standalone approval-note sections.
        if is_standalone_approval_note(section_content):
            logger.info(
                "Skipping standalone approval note: %s",
                source,
            )
            continue

        heading_path = section["heading_path"]

        section_name = (
            " > ".join(heading_path)
            if heading_path
            else "General"
        )

        heading_context = (
            f"Document: {source}\n"
            f"Section: {section_name}\n\n"
        )

        content_blocks = split_into_paragraphs(
            section_content
        )

        current_content = ""

        for block in content_blocks:

            block_parts = split_large_block(
                block,
                max_size,
            )

            for part in block_parts:

                candidate = (
                    f"{current_content}\n\n{part}".strip()
                )

                if (
                    len(heading_context) + len(candidate) > max_size
                    and current_content
                ):

                    chunks.append({
                        "text": heading_context + current_content,
                        "topic": topic,
                        "section": section_name,
                        "approval_status": approval_status,
                    })

                    # Retain a small overlap for continuity.
                    overlap = current_content[-CHUNK_OVERLAP:]

                    current_content = (
                        overlap + "\n\n" + part
                    ).strip()

                else:
                    current_content = candidate

        if current_content.strip():

            chunks.append({
                "text": heading_context + current_content,
                "topic": topic,
                "section": section_name,
                "approval_status": approval_status,
            })

    return chunks


def ingest_documents():
    """Read, chunk, embed, and index all knowledge documents."""

    logger.info("Starting knowledge-base ingestion...")

    if not KNOWLEDGE_DIR.exists():
        raise FileNotFoundError(
            f"Knowledge directory not found: {KNOWLEDGE_DIR}"
        )

    files = [
        path
        for path in KNOWLEDGE_DIR.rglob("*")
        if path.is_file()
        and path.suffix.lower() in [".md", ".txt", ".pdf"]
        and not path.name.lower().startswith("readme")
    ]

    if not files:
        logger.warning("No supported knowledge files found.")
        return

    all_documents = []
    all_metadatas = []
    all_ids = []

    for file_path in files:

        source = file_path.relative_to(
            KNOWLEDGE_DIR
        ).as_posix()

        logger.info("Processing: %s", source)

        text = extract_text(file_path)

        if not text.strip():
            logger.warning(
                "No extractable text: %s",
                source,
            )
            continue

        chunks = heading_aware_chunks(
            text=text,
            source=source,
        )

        logger.info(
            "Created %d chunks from %s",
            len(chunks),
            source,
        )

        for index, chunk in enumerate(chunks):

            all_documents.append(chunk["text"])

            all_metadatas.append({
                "source": source,
                "chunk_index": index,
                "topic": chunk["topic"],
                "section": chunk["section"],
                "approval_status": chunk["approval_status"],
            })

            all_ids.append(
                f"{source}__chunk_{index}"
            )

    if not all_documents:
        logger.warning("No document chunks were created.")
        return

    logger.info(
        "Generating embeddings for %d chunks...",
        len(all_documents),
    )

    embeddings = embedding_model.encode(
        all_documents,
        normalize_embeddings=True,
        show_progress_bar=True,
    ).tolist()

    # Rebuild the existing collection.
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass

    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    batch_size = 100

    for start in range(0, len(all_documents), batch_size):

        end = start + batch_size

        collection.add(
            ids=all_ids[start:end],
            documents=all_documents[start:end],
            embeddings=embeddings[start:end],
            metadatas=all_metadatas[start:end],
        )

    logger.info(
        "Ingestion completed. Files: %d | Chunks: %d",
        len(files),
        len(all_documents),
    )


if __name__ == "__main__":

    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s:%(name)s:%(message)s",
    )

    ingest_documents()
