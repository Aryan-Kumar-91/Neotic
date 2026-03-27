# Noetic: Advanced AI Reasoning & Visualization

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://www.python.org/)

**Noetic** is an enterprise-grade AI reasoning platform that bridges the gap between complex Chain-of-Thought (CoT) processes and user understanding. By visualizing internal analytical steps as a dynamic Directed Acyclic Graph (DAG), Noetic provides unprecedented transparency into AI decision-making.

---

### Hackathon Spotlight

Developed and presented at **HIRE-4-THON**, a National Level Hackathon organized by **K.S. School of Engineering and Management (KSSEM)**.

---

## Key Features

- **Visualized Reasoning Graph:** Real-time rendering of AI's internal reasoning chain using `@xyflow/react` (React Flow) as an interactive DAG.
- **Gemini-Flash Integration:** High-speed reasoning powered by Google's Gemini 2.0 Flash models with dynamic model negotiation.
- **Progressive RAG Engine:** Built-in Retrieval-Augmented Generation (LangChain + ChromaDB) for querying local PDF/TXT knowledge bases.
- **Multi-Tier Auth & Quota:** Secure session management via Supabase with an intelligent guest-quota system.
- **Glassmorphic UI:** High-fidelity interface with dynamic dark/light modes, animated particle backgrounds, and custom Markdown parsing.
- **Enterprise MVC Architecture:** Monolith-free design with clear separation of `services`, `controllers`, and `middlewares`.

---

## Tech Stack

### Frontend

- **Framework:** Next.js 16 (React 19)
- **Styling:** Tailwind CSS 4 + Lucide Icons
- **Visualization:** React Flow (@xyflow/react)
- **Authentication:** Supabase Auth (JWT)

### Backend

- **Core:** Python FastAPI + Uvicorn
- **AI Core:** Google Generative AI (Gemini 2.0 Flash)
- **Data Processing:** LangChain + ChromaDB (for RAG)
- **Real-time:** WebSockets for RAG visualization streaming

---

## System Architecture

![Noetic Architecture](./public/SYSTEM%20ARCHITECTURE.png)

The Noetic engine orchestrates a low-latency pipeline between the user and the LLM, streaming thought fragments in real-time to prevent "black box" waiting periods.

---

## Getting Started

### Prerequisites

- **Node.js** (v20 or newer)
- **Python** (v3.10 or newer)
- **Supabase Project** (for Auth & Storage)
- **Google AI Studio API Key** (Gemini)

### 1. Backend Setup

```bash
# Navigate to backend
cd server

# Install dependencies
pip install -r requirements.txt

# Configure your .env (refer to Environment Variables)
# Start the server
python server.py
# Backend listening on http://127.0.0.1:8001
```

### 2. Frontend Setup

```bash
# In the root project directory
npm install

# Configure your .env.local
npm run dev
# Frontend running on http://localhost:3000
```

---

## Environment Variables

### Backend (`server/.env`)

| Variable              | Description                                                      |
| :-------------------- | :--------------------------------------------------------------- |
| `GOOGLE_API_KEY`      | Your Google Gemini API Key                                       |
| `SUPABASE_JWT_SECRET` | Secret key from Supabase project settings                        |
| `DISABLE_AUTH`        | Set to `true` to bypass auth during local dev (`false` for prod) |
| `CORS_ORIGINS`        | Permitted origins (e.g., `http://localhost:3000`)                |

### Frontend (`.env.local`)

| Variable                        | Description                                                   |
| :------------------------------ | :------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`           | URL of the FastAPI gateway (default: `http://localhost:8001`) |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key                                   |

---

## Project Structure

```text
Neotic/
├── src/                # Next.js Frontend
│   ├── app/            # App Router (Parallel & Intercepting Routes)
│   ├── components/     # UI/UX & React Flow Visualizers
│   ├── hooks/          # Custom state hooks (useChatState, etc.)
│   └── api/            # Isolated Chat & RAG clients
├── server/             # Python FastAPI Backend
│   ├── src/            # Backend MVC Core
│   │   ├── routes/     # Chat & AI Endpoints
│   │   ├── middlewares/# Auth & CORS handlers
│   │   └── rag/        # Vector DB & WebSocket Logic
│   └── server.py       # Application Entry Point
└── public/             # Static Assets & Architecture Documentation
```

---

## The Development Team

| Name             | Role                            | USN        |
| :--------------- | :------------------------------ | :--------- |
| **Aryan Kumar**  | **Lead Architect / PM**         | 1KG23AD002 |
| **Tanmay Singh** | **UI/UX Engineer / WebSockets** | 1KG23AD056 |
| **Pranav**       | **Backend Engineer / API**      | 1KG23CB038 |
| **G Pavan**      | **AI Specialist / RAG**         | 1KG23CB014 |

---

## License

This repository is licensed under the **GNU General Public License v3.0**. See the [LICENSE](LICENSE) file for more details.

---

_Developed with excellence by the Team Noetic (2026)._
