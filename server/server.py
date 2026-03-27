import uvicorn
from fastapi import FastAPI, WebSocket
from src.middlewares.cors import setup_cors
from src.routes.chat_routes import router as chat_router
from src.rag.websocket import handle_rag_websocket

app = FastAPI(title="Noetic Backend Core")

# Initialize Middlewares
setup_cors(app)

# Mount Routes
app.include_router(chat_router, prefix="/api")

# Handle RAG WebSockets (Consolidated from rag-visualizer)
@app.websocket("/ws/rag")
async def websocket_rag(websocket: WebSocket):
    await handle_rag_websocket(websocket)

if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8001, reload=True)
