# Noetic 🌌

Noetic is an advanced, enterprise-grade AI chat application that visualizes Chain-of-Thought (CoT) reasoning. The application utilizes a modern Next.js 15 frontend combined with a scalable Python FastAPI backend powered by Google's Gemini Flash models.

## 🚀 Features
- **Visualized Reasoning Graph:** Dynamically maps out the AI's internal thoughts and analytical steps using `@xyflow/react` as an interactive Directed Acyclic Graph (DAG) before delivering the final answer.
- **Progressive Guest Quota System:** Frictionless trial experience for guests, capped by an intelligent local-storage quota designed to drive authorized conversions via Supabase.
- **Dynamic AI Handshake:** The Python backend dynamically negotiates and securely binds to the most capable Gemini 'flash' model authorized by your API key.
- **Enterprise MVC Architecture:** Monolith-free design. Clean separation of concerns with isolated `services/`, `controllers/`, and `middlewares/` on the backend, paired with custom hook extractions on the frontend.
- **Sleek Aesthetic:** High-fidelity Glassmorphic UI, dynamic Dark/Light modes, animated particle backgrounds, and strict custom Markdown parsing.

## 🛠 Tech Stack
### Frontend
- **Framework:** Next.js 15 (React 19)
- **Styling:** Tailwind CSS + Lucide Icons
- **Auth:** Supabase Auth
- **Visualization:** React Flow (xyflow)

### Backend
- **Framework:** Python FastAPI + Uvicorn
- **AI Engine:** Google Generative AI (`gemini-1.5-flash`)
- **Structure:** MVC (Model-View-Controller) Microservice Design

## 📦 Getting Started

### 1. Backend Setup
```bash
cd cot-backend
pip install -r requirements.txt
# Add your GOOGLE_API_KEY to cot-backend/.env
python server.py
# Running on http://127.0.0.1:8001
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Ensure NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SUPABASE_URL are set in frontend/.env.local
npm run dev
# Running on http://localhost:3000
```

## 📄 License
This project is licensed under the [GNU General Public License v3.0](LICENSE).
