<!-- BEGIN:nextjs-agent-rules -->
# ⚠️ Next.js Compatibility Warning
This version of Next.js has development-breaking changes and custom conventions.
- Always check `node_modules/next/dist/docs/` for API specifics.
- Heed deprecation notices in logs.
<!-- END:nextjs-agent-rules -->

## 🏗️ Project Architecture
- **Frontend**: Next.js 16 (React 19) App Router. Main code in root `/src`.
- **Backend**: FastAPI (Python 3.10+). Main code in `/server`.
- **Reasoning Engine**: Google Gemini 2.0 Flash via LangChain + CoT.
- **Vector Store**: ChromaDB for RAG operations in `/server/src/rag/`.

## 🔐 Security & Certificates
- **Local SSL**: Self-signed certs generated via `server/gen-certs.ps1`.
- **Certificate Storage**: Generated files (`.pfx`, `.crt`, `.key`, `.pem`) live in the root `/certificates/` folder.
- **Git Policy**: The `/certificates/` folder is EXCLUDED from history and ignored via `.gitignore`.
- **Passwords**: Local development certificates use "neotic" as the default password.

## 🎨 Styling & Linting
- **Tailwind**: Tailwind CSS 4 is the core styling engine.
- **Global CSS**: `src/app/globals.css` uses modern `@theme` and `@keyframes`.
- **Codacy Policy**: DO NOT try to fix "CSSLint" errors in `globals.css` by modifying the CSS syntax (false positives). These are excluded via `.codacy.yml`.

## 📡 Backend Development
- **WebSockets**: Real-time RAG reasoning is streamed via `/server/src/rag/websocket.py`.
- **Session IDs**: Every reasoning chain uses a unique `root_id` (UUIDv4) for state tracking.
- **Error Handling**: Use explicit `print()` or logging in `try-except` blocks. Never use a bare `pass` (fails Bandit security checks).
