"""
Routes for managing the research document library (upload, list, delete).
"""

import os
import shutil

from fastapi import APIRouter, UploadFile, File, HTTPException  # pylint: disable=import-error

ROUTER = APIRouter()
DATA_DIR = "data"
PERSIST_DIR = "chroma_db_gemini"
ALLOWED_EXTENSIONS = {".pdf", ".txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)


def _resolve_safe_path(raw_name: str) -> str:
    """
    Strip directory components from *raw_name*, construct an absolute path
    inside DATA_DIR, and verify it cannot escape the directory tree.

    Raises HTTP 400 if the sanitised path is outside DATA_DIR.
    """
    safe_name = os.path.basename(raw_name)
    if not safe_name or safe_name in (".", ".."):
        raise HTTPException(status_code=400, detail="Invalid filename.")

    base = os.path.realpath(DATA_DIR)
    target = os.path.realpath(os.path.join(base, safe_name))
    if not target.startswith(base + os.sep):
        raise HTTPException(status_code=400, detail="Invalid filename.")

    return target


def _validate_document_name(raw_name: str) -> str:
    """Return a safe, supported document filename or raise a client error."""
    safe_name = os.path.basename(raw_name)
    extension = os.path.splitext(safe_name)[1].lower()
    if not safe_name or safe_name in (".", ".."):
        raise HTTPException(status_code=400, detail="Invalid filename.")
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Only PDF and TXT files are supported.")
    return safe_name


def _invalidate_rag_index() -> None:
    """Remove the persisted index so the next query rebuilds it from current files."""
    if os.path.isdir(PERSIST_DIR):
        shutil.rmtree(PERSIST_DIR)


@ROUTER.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a supported document to the research library."""
    safe_name = _validate_document_name(file.filename or "")
    file_path = _resolve_safe_path(safe_name)

    try:
        contents = await file.read(MAX_FILE_SIZE + 1)
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File must be 10 MB or smaller.")
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        _invalidate_rag_index()
        return {"filename": safe_name, "status": "success"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to save document.") from exc
    finally:
        await file.close()


@ROUTER.get("/list")
async def list_documents():
    """List supported documents in the research library."""
    try:
        files = sorted(
            name
            for name in os.listdir(DATA_DIR)
            if os.path.splitext(name)[1].lower() in ALLOWED_EXTENSIONS
        )
        return {"files": files}
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to list documents.") from exc


@ROUTER.delete("/delete/{filename}")
async def delete_document(filename: str):
    """Delete a supported document from the research library."""
    safe_name = _validate_document_name(filename)
    file_path = _resolve_safe_path(safe_name)
    if os.path.exists(file_path):
        os.remove(file_path)
        _invalidate_rag_index()
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="File not found")


__all__ = ["ROUTER"]
