"""
API routes for chat-related operations.
"""
from fastapi import APIRouter, HTTPException
from src.controllers.chatcontroller import process_chat
from src.types.schemas import ChatRequest

router = APIRouter()

@router.post("/chat")
async def generate_cot(request: ChatRequest):
    """
    Handle chat requests and produce Chain-of-Thought reasoning.
    """
    try:
        return await process_chat(request.prompt, request.files)
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
