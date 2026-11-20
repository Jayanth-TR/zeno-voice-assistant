
import logging
import re
import uuid

from pathlib import Path

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    HTTPException
)

from starlette.concurrency import run_in_threadpool

from app.rag.pdf_processor import (
    UPLOAD_DIR,
    MAX_FILE_SIZE,
    ingest_pdf,
    delete_pdf
)


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"]
)


def safe_filename(filename: str) -> str:
    """
    Keep a safe display filename.
    """

    name = Path(filename).name

    name = re.sub(
        r"[^a-zA-Z0-9._ -]",
        "_",
        name
    )

    return name[:180] or "uploaded.pdf"


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    workspace_id: str = Form("default")
):
    """
    Upload a PDF, extract text, create embeddings,
    and store the chunks in ChromaDB.
    """

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required."
        )

    if Path(file.filename).suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    if not workspace_id.strip():
        raise HTTPException(
            status_code=400,
            detail="Workspace ID is required."
        )

    try:
        file_bytes = await file.read(MAX_FILE_SIZE + 1)

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty."
            )

        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds the 20 MB upload limit."
            )

        document_id = str(uuid.uuid4())

        original_filename = safe_filename(
            file.filename
        )

        # Store the PDF using a generated filename.
        # Never use the user's filename as a filesystem path.
        file_path = UPLOAD_DIR / f"{document_id}.pdf"

        file_path.write_bytes(file_bytes)

        try:
            result = await run_in_threadpool(
                ingest_pdf,
                file_path,
                original_filename,
                document_id,
                workspace_id.strip()
            )

            return {
                "success": True,
                "message": "PDF uploaded and indexed successfully.",
                "document": result
            }

        except ValueError as exc:

            file_path.unlink(missing_ok=True)

            raise HTTPException(
                status_code=422,
                detail=str(exc)
            )

        except Exception:

            file_path.unlink(missing_ok=True)

            logger.exception("PDF ingestion failed.")

            raise HTTPException(
                status_code=500,
                detail="Failed to process the PDF."
            )

    finally:
        await file.close()


@router.delete("/{document_id}")
async def remove_document(
    document_id: str,
    workspace_id: str = "default"
):
    """
    Remove the document's chunks and original PDF.
    """

    try:

        result = await run_in_threadpool(
            delete_pdf,
            document_id,
            workspace_id
        )

        file_path = UPLOAD_DIR / f"{document_id}.pdf"

        if file_path.exists():
            file_path.unlink()

        return {
            "success": True,
            "message": "Document deleted successfully.",
            "result": result
        }

    except ValueError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc)
        )

    except Exception:

        logger.exception("Document deletion failed.")

        raise HTTPException(
            status_code=500,
            detail="Failed to delete the document."
        )
