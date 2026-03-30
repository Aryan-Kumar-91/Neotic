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


def _safe_path(filename: str) -> str:
    """
    Resolve a filename to an absolute path inside DATA_DIR and raise
    an HTTP 400 if the resolved path escapes the data directory
    (path-traversal guard).
    """
    base = os.path.realpath(DATA_DIR)
    target = os.path.realpath(os.path.join(base, os.path.basename(filename)))
    if not target.startswith(base + os.sep) and target != base:
        raise HTTPException(status_code=400, detail="Invalid filename.")
    return target


@ROUTER.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document to the research library (data/ folder).
    """
    file_path = _safe_path(file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"filename": file.filename, "status": "success"}
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
    file_path = _safe_path(filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="File not found")
