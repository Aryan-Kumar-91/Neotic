from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import shutil

ROUTER = APIRouter()
DATA_DIR = "data"

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

@ROUTER.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document to the research library (data/ folder).
    """
    file_path = os.path.join(DATA_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"filename": file.filename, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ROUTER.get("/list")
async def list_documents():
    """
    List all documents in the research library.
    """
    try:
        files = os.listdir(DATA_DIR)
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ROUTER.delete("/delete/{filename}")
async def delete_document(filename: str):
    """
    Delete a document from the research library.
    """
    file_path = os.path.join(DATA_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"status": "deleted"}
    else:
        raise HTTPException(status_code=404, detail="File not found")
