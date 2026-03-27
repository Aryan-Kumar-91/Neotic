from fastapi import APIRouter, HTTPException
from src.controllers.chatcontroller import process_chat
from src.types.schemas import ChatRequest

router = APIRouter()

@router.post("/chat")
async def generate_cot(request: ChatRequest):
    try:
        return await process_chat(request.prompt, request.files)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
