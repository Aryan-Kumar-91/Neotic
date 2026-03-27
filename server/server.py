"""
Noetic Backend Core - Main entry point for the FastAPI server.
"""
import uvicorn
from fastapi import FastAPI, WebSocket
from src.middlewares.cors import setup_cors
from src.routes.chatroutes import ROUTER as chat_router
from src.rag.websocket import handle_rag_websocket

APP = FastAPI(title="Noetic Backend Core")

# Initialize Middlewares
setup_cors(APP)

# Mount Routes
APP.include_router(chat_router, prefix="/api")

# Handle RAG WebSockets (Consolidated from rag-visualizer)
@APP.websocket("/ws/rag")
async def websocket_rag(websocket: WebSocket):
    """
    WebSocket endpoint for real-time RAG visualization signals.
    """
    await handle_rag_websocket(websocket)

if __name__ == "__main__":
    uvicorn.run("server:APP", host="127.0.0.1", port=8001, reload=True)
