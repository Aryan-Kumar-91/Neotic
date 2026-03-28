"""
Service and tools for Retrieval-Augmented Generation (RAG) using Gemini and LangChain.
"""
import os
import uuid
from typing import Any, Dict, Optional

# pylint: disable=import-error
from fastapi import WebSocket
from langchain.agents import create_agent
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.vectorstores import Chroma
from langchain_core.callbacks import AsyncCallbackHandler
from langchain_core.tools.retriever import create_retriever_tool
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from src.config.env import GOOGLE_API_KEY

# Ensure data and db directories exist relative to the server root
DATA_DIR = "data"
PERSIST_DIR = "chroma_db_gemini"

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

class CoTAsyncHandler(AsyncCallbackHandler):
    """
    Custom Async handler for Gemini models.
    Streams retrieval and thought steps via WebSocket.
    """
    def __init__(self, websocket: WebSocket, parent_id: Optional[str] = None):
        self.websocket = websocket
        self.parent_id = parent_id

    @staticmethod
    def _get_id():
        """
        Produce a unique identifier for a step.
        """
        return str(uuid.uuid4())

    async def on_tool_start(
            self,
            _serialized: Dict[str, Any],
            input_str: str,
            **_kwargs: Any
    ) -> None:
        """
        Notify the client when a retrieval tool starts executing.
        """
        new_id = self._get_id()
        await self.websocket.send_json({
            "id": new_id,
            "parent_id": self.parent_id,
            "step": "Action",
            "type": "retrieval_start",
            "content": f"Querying Gemini Knowledge: {input_str}"
        })
        self.parent_id = new_id

    async def on_tool_end(self, output: str, **_kwargs: Any) -> Any:
        """
        Notify the client when retrieval completes with the found context.
        """
        new_id = self._get_id()
        await self.websocket.send_json({
            "id": new_id,
            "parent_id": self.parent_id,
            "step": "Observation",
            "type": "retrieval_end",
            "content": f"Gemini found context: {output[:500]}..."
        })
        self.parent_id = new_id

def initialize_gemini_rag():
    """
    Initialize the ChromaDB vector store and return a LangChain retriever tool.
    """
    # Use the embeddings model for Gemini
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004",
        google_api_key=GOOGLE_API_KEY
    )

    if os.path.exists(PERSIST_DIR) and os.listdir(PERSIST_DIR):
        print("✓ Loading existing Gemini vector database...")
        vectorstore = Chroma(
            persist_directory=PERSIST_DIR,
            embedding_function=embeddings
        )
    else:
        print("⚠ DB not found. Scraping data for Gemini-precision indexing...")
        all_docs = []
        if os.path.exists(DATA_DIR):
            for file_name in os.listdir(DATA_DIR):
                file_path = os.path.join(DATA_DIR, file_name)
                if file_name.endswith('.pdf'):
                    loader = PyPDFLoader(file_path)
                    all_docs.extend(loader.load())
                elif file_name.endswith('.txt'):
                    loader = TextLoader(file_path)
                    all_docs.extend(loader.load())

        if not all_docs:
            print("⚠ No source documents found in 'data/' folder.")
            return None

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100
        )
        splits = text_splitter.split_documents(all_docs)

        print(f"✓ Persisting {len(splits)} chunks to Gemini DB...")
        vectorstore = Chroma.from_documents(
            documents=splits,
            embedding=embeddings,
            persist_directory=PERSIST_DIR
        )

    retriever_tool = create_retriever_tool(
        vectorstore.as_retriever(),
        "local_search",
        "Search your verified PDF or TXT knowledge base using Gemini."
    )
    return retriever_tool

def get_rag_tool():
    """
    Global getter for the RAG tool with error handling.
    """
    # pylint: disable=broad-except
    try:
        return initialize_gemini_rag()
    except Exception as error:
        print(f"⚠ Failed to initialize RAG: {error}")
        return None

def create_gemini_agent():
    """
    Factory function to create a Gemini-powered agent configured with RAG tools.
    """
    # Chat model setup
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-exp",
        temperature=0,
        streaming=True,
        google_api_key=GOOGLE_API_KEY
    )

    rag_tool = get_rag_tool()
    tools = [rag_tool] if rag_tool else []

    # Factory-based agent
    agent = create_agent(
        model=llm,
        tools=tools,
        system_prompt=(
            "You are a helpful assistant powered by Google Gemini. "
            "Use tools to verify facts from the local knowledge base."
        )
    )
    return agent
