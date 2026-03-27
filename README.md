# Noetic

Noetic is an advanced, enterprise-grade AI chat application that visualizes Chain-of-Thought (CoT) reasoning. The application utilizes a modern Next.js 16 frontend combined with a scalable Python FastAPI backend powered by Google's Gemini Flash models.

## Features
- **Visualized Reasoning Graph:** Dynamically maps out the AI's internal thoughts and analytical steps using `@xyflow/react` as an interactive Directed Acyclic Graph (DAG) before delivering the final answer.
- **Progressive Guest Quota System:** Frictionless trial experience for guests, capped by an intelligent local-storage quota designed to drive authorized conversions via Supabase.
- **Dynamic AI Handshake:** The Python backend dynamically negotiates and securely binds to the most capable Gemini 'flash' model authorized by your API key.
- **Enterprise MVC Architecture:** Monolith-free design. Clean separation of concerns with isolated `services/`, `controllers/`, and `middlewares/` on the backend, paired with custom hook extractions on the frontend.
- **Sleek Aesthetic:** High-fidelity Glassmorphic UI, dynamic Dark/Light modes, animated particle backgrounds, and strict custom Markdown parsing.

## System Architecture

![System Architecture](./public/SYSTEM%20ARCHITECTURE.png)

The Noetic architecture is designed for low-latency AI reasoning and real-time visualization:
1. **Frontend (Next.js 16)**: Connects to the backend via REST (for chat) and WebSockets (for RAG).
2. **Real-time Reasoning Engine**: Streams Chain-of-Thought steps as they are generated, rather than waiting for the final answer.
3. **Graph DAG (React Flow)**: Dynamically renders each thought step as a node in an interactive graph, allowing users to trace the AI's logic visually.
4. **RAG Component (LangChain + ChromaDB)**: Enables the AI to query localized PDF/TXT knowledge bases before generating thoughts.
5. **Backend Core (FastAPI)**: Manages model orchestration, session state, and multimodal file processing.

## Tech Stack
### Frontend
- **Framework:** Next.js 16 (React 19)
- **Styling:** Tailwind CSS 4 + Lucide Icons
- **Auth:** Supabase Auth
- **Visualization:** React Flow (xyflow)

### Backend
- **Framework:** Python FastAPI + Uvicorn
- **AI Engine:** Google Generative AI (Gemini 2.0 Flash)
- **Structure:** MVC (Model-View-Controller) Microservice Design

## Getting Started

### 1. Backend Setup
```bash
cd server
pip install -r requirements.txt
# Add your GOOGLE_API_KEY to server/.env
python server.py
# Running on http://127.0.0.1:8001
```

### 2. Frontend Setup
```bash
# In the root directory
npm install
# Ensure NEXT_PUBLIC_SUPABASE_URL is set in .env.local
npm run dev
# Running on http://localhost:3000
```

## The Team

| Name | USN | Project Role |
| :--- | :--- | :--- |
| **Aryan Kumar** | 1KG23AD002 | **Team Leader** • Project Management & System Architecture |
| **Tanmay Singh** | 1KG23AD056 | **Frontend Developer** • UI/UX Design & WebSocket Integration |
| **Pranav** | 1KG23CB038 | **Backend Developer** • API Design & MVC Implementation |
| **G Pavan** | 1KG23CB014 | **AI Specialist** • RAG Systems & Prompt Engineering |

## License
This project is licensed under the [GNU General Public License v3.0](LICENSE).
