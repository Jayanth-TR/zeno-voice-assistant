
import hashlib
import logging
import re
import uuid

from pathlib import Path
from typing import Any, Dict, List


from pypdf import PdfReader
from app.rag.retriever import collection, embedding_model
# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]

UPLOAD_DIR = BASE_DIR / "uploads"
VECTOR_DIR = BASE_DIR / "vector_store"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

COLLECTION_NAME = "netcore_knowledge"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
MAX_PAGES = 200

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150

logger = logging.getLogger(__name__)




# --------------------------------------------------
# VALIDATE PDF
# --------------------------------------------------

def validate_pdf(file_bytes: bytes) -> None:
    if not file_bytes:
        raise ValueError("The uploaded file is empty.")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise ValueError("PDF exceeds the 20 MB upload limit.")

    # Basic file signature validation.
    if not file_bytes.startswith(b"%PDF-"):
        raise ValueError("Invalid PDF file.")


# --------------------------------------------------
# EXTRACT PDF TEXT PAGE BY PAGE
# --------------------------------------------------

def extract_pdf_pages(file_path: Path) -> List[Dict[str, Any]]:
    try:
        reader = PdfReader(str(file_path))

        if reader.is_encrypted:
            raise ValueError(
                "Password-protected PDFs are not supported."
            )

        if len(reader.pages) > MAX_PAGES:
            raise ValueError(
                f"PDF exceeds the {MAX_PAGES}-page limit."
            )

        pages = []

        for page_number, page in enumerate(
            reader.pages,
            start=1
        ):
            text = page.extract_text() or ""

            # Normalize whitespace while retaining paragraphs.
            text = re.sub(r"[ \t]+", " ", text)
            text = re.sub(r"\n{3,}", "\n\n", text)
            text = text.strip()

            if text:
                pages.append({
                    "page": page_number,
                    "text": text
                })

        if not pages:
            raise ValueError(
                "No extractable text found. "
                "This may be a scanned PDF and requires OCR."
            )

        return pages

    except ValueError:
        raise

    except Exception as exc:
        logger.exception("PDF extraction failed.")
        raise ValueError(
            "Unable to read this PDF."
        ) from exc


# --------------------------------------------------
# CHUNK TEXT
# --------------------------------------------------

def split_text(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP
) -> List[str]:
    """
    Split text into overlapping chunks.

    Prefer paragraph or sentence boundaries where possible.
    """

    if not text.strip():
        return []

    if overlap >= chunk_size:
        raise ValueError(
            "Chunk overlap must be smaller than chunk size."
        )

    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:

        end = min(
            start + chunk_size,
            text_length
        )

        if end < text_length:

            # Prefer a paragraph boundary.
            boundary = text.rfind(
                "\n",
                start + chunk_size // 2,
                end
            )

            # Otherwise prefer a sentence boundary.
            if boundary == -1:
                boundary = text.rfind(
                    ". ",
                    start + chunk_size // 2,
                    end
                )

                if boundary != -1:
                    boundary += 1

            if boundary != -1:
                end = boundary

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= text_length:
            break

        start = max(
            end - overlap,
            start + 1
        )

    return chunks


# --------------------------------------------------
# PROCESS PDF PAGES
# --------------------------------------------------

def create_pdf_chunks(
    pages: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:

    all_chunks = []

    chunk_index = 0

    for page_data in pages:

        page_number = page_data["page"]
        page_text = page_data["text"]

        page_chunks = split_text(page_text)

        for chunk in page_chunks:

            all_chunks.append({
                "chunk_index": chunk_index,
                "page": page_number,
                "content": chunk
            })

            chunk_index += 1

    return all_chunks


# --------------------------------------------------
# INGEST PDF INTO CHROMADB
# --------------------------------------------------

def ingest_pdf(
    file_path: Path,
    original_filename: str,
    document_id: str,
    workspace_id: str = "default"
) -> Dict[str, Any]:

    pages = extract_pdf_pages(file_path)

    chunks = create_pdf_chunks(pages)

    if not chunks:
        raise ValueError(
            "No usable text chunks were created."
        )

    logger.info(
        "PDF extracted | Pages: %s | Chunks: %s",
        len(pages),
        len(chunks)
    )

    # Create embeddings in batches.
    batch_size = 32

    for batch_start in range(
        0,
        len(chunks),
        batch_size
    ):

        batch = chunks[
            batch_start:batch_start + batch_size
        ]

        documents = [
            item["content"]
            for item in batch
        ]

        embeddings = embedding_model.encode(
            documents,
            normalize_embeddings=True,
            show_progress_bar=False
        ).tolist()

        ids = [
            f"{document_id}_{item['chunk_index']}"
            for item in batch
        ]

        metadatas = []

        for item in batch:

            metadatas.append({
                "document_id": document_id,
                "source": original_filename,
                "page": item["page"],
                "chunk_index": item["chunk_index"],
                "topic": "uploaded_pdf",
                "approval_status": "user_uploaded",
                "workspace_id": workspace_id,
                "file_type": "pdf"
            })

        collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )

    logger.info(
        "PDF ingestion completed | Document ID: %s",
        document_id
    )

    return {
        "document_id": document_id,
        "filename": original_filename,
        "total_pages": len(pages),
        "total_chunks": len(chunks),
        "workspace_id": workspace_id,
        "status": "indexed"
    }


# --------------------------------------------------
# DELETE DOCUMENT FROM CHROMADB
# --------------------------------------------------

def delete_pdf(
    document_id: str,
    workspace_id: str = "default"
) -> Dict[str, Any]:

    result = collection.get(
        where={
            "$and": [
                {"document_id": document_id},
                {"workspace_id": workspace_id}
            ]
        },
        include=["metadatas"]
    )

    ids = result.get("ids", [])

    if not ids:
        raise ValueError(
            "Document not found."
        )

    collection.delete(ids=ids)

    return {
        "document_id": document_id,
        "deleted_chunks": len(ids),
        "status": "deleted"
    }


# --------------------------------------------------
# DOCUMENT RETRIEVAL
# --------------------------------------------------

def get_document_chunks(
    document_id: str,
    workspace_id: str = "default"
) -> List[Dict[str, Any]]:

    result = collection.get(
        where={
            "$and": [
                {"document_id": document_id},
                {"workspace_id": workspace_id}
            ]
        },
        include=[
            "documents",
            "metadatas"
        ]
    )

    output = []

    for document, metadata in zip(
        result.get("documents", []),
        result.get("metadatas", [])
    ):

        output.append({
            "content": document,
            "metadata": metadata
        })

    return output
