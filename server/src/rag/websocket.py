"""
WebSocket handler for real-time RAG visualization and streaming.
"""
import json
import uuid
from fastapi import WebSocket, WebSocketDisconnect
from langchain_core.messages import HumanMessage
from src.rag.service import CoTAsyncHandler, create_gemini_agent

async def handle_rag_websocket(websocket: WebSocket):
    """
    Handle a persistent WebSocket connection for RAG operations.
    """
    await websocket.accept()

    # Establish root ID for this session
    root_id = str(uuid.uuid4())
    handler = CoTAsyncHandler(websocket, parent_id=root_id)
    agent_executor = create_gemini_agent()

    try:
        while True:
            # Receive input from client (e.g., { "question": "What is Neotic?" })
            data = await websocket.receive_text()
            user_input = json.loads(data).get("question")

            if not user_input:
                continue

            print(f"📡 Executing Gemini RAG Reasoning for: {user_input[:50]}...")

            # Execute the agent, passing through the WebSocket callback handler
            response = await agent_executor.ainvoke(
                {"messages": [HumanMessage(content=user_input)]},
                config={"callbacks": [handler]}
            )

            # Extract final answer from the messages chain
            final_content = response["messages"][-1].content

            # Send completion response back to client
            await websocket.send_json({
                "id": str(uuid.uuid4()),
                "parent_id": handler.parent_id,
                "step": "Final Answer",
                "content": final_content
            })

    except WebSocketDisconnect:
        print("🔌 RAG Client disconnected.")
    except Exception as websocket_error:
        # pylint: disable=broad-except
        print(f"❌ RAG WebSocket Error: {websocket_error}")
        try:
            await websocket.send_json({"error": str(websocket_error)})
        except Exception:
            # Reached when client disconnected before error could be sent.
            # pylint: disable=broad-except
            pass
