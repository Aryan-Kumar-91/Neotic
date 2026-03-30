"""
Routes for managing the research document library (upload, list, delete).
"""
import os
import shutil

from fastapi import APIRouter, UploadFile, File, HTTPException  # pylint: disable=import-error

ROUTER = APIRouter()
DATA_DIR = "data"

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)


def _resolve_safe_path(raw_name: str) -> str:
    """
    Strip directory components from *raw_name*, construct an absolute path
    inside DATA_DIR, and verify it cannot escape the directory tree.

    Raises HTTP 400 if the sanitised path is outside DATA_DIR.
    """
    # os.path.basename() is the recognised sanitiser for path-traversal:
    # it removes any leading directory components (e.g. '../').
    safe_name = os.path.basename(raw_name)
    if not safe_name or safe_name in ('.', '..'):
        raise HTTPException(status_code=400, detail="Invalid filename.")

    base = os.path.realpath(DATA_DIR)
    target = os.path.realpath(os.path.join(base, safe_name))
    if not target.startswith(base + os.sep):
        raise HTTPException(status_code=400, detail="Invalid filename.")

    return target


@ROUTER.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document to the research library (data/ folder).
    """
    # Sanitise the filename immediately; use only the sanitised value below.
    safe_name = os.path.basename(file.filename)
    if not safe_name or safe_name in ('.', '..'):
        raise HTTPException(status_code=400, detail="Invalid filename.")

    file_path = _resolve_safe_path(safe_name)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"filename": safe_name, "status": "success"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@ROUTER.get("/list")
async def list_documents():
    """
    List all documents in the research library.
    """
    try:
        files = os.listdir(DATA_DIR)
        return {"files": files}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@ROUTER.delete("/delete/{filename}")
async def delete_document(filename: str):
    """
    Delete a document from the research library.
    """
    # Sanitise the filename immediately; use only the sanitised value below.
    safe_name = os.path.basename(filename)
    if not safe_name or safe_name in ('.', '..'):
        raise HTTPException(status_code=400, detail="Invalid filename.")

    file_path = _resolve_safe_path(safe_name)
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="File not found")
