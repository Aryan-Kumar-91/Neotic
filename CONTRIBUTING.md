# Contributing to Neotic

Thank you for your interest in contributing to **Neotic**! We welcome contributions from developers of all skill levels. Whether you are fixing bugs, proposing new features, improving documentation, or optimizing reasoning graph visualizers, your efforts are greatly appreciated.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features & Enhancements](#suggesting-features--enhancements)
  - [Submitting Code Changes](#submitting-code-changes)
- [Prerequisites & Development Setup](#prerequisites--development-setup)
  - [Prerequisites](#prerequisites)
  - [Frontend Setup (Vite + React 19)](#frontend-setup-vite--react-19)
  - [Backend Setup (FastAPI + Python)](#backend-setup-fastapi--python)
- [Development Guidelines](#development-guidelines)
  - [Frontend Conventions](#frontend-conventions)
  - [Backend Conventions](#backend-conventions)
  - [Git Branching Strategy](#git-branching-strategy)
  - [Commit Message Guidelines](#commit-message-guidelines)
- [Local Verification & Testing](#local-verification--testing)
  - [Frontend Checks](#frontend-checks)
  - [Backend Checks](#backend-checks)
- [Pull Request Process](#pull-request-process)
- [Need Help?](#need-help)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it to ensure a welcoming, inclusive, and harassment-free environment for everyone.

---

## How Can I Contribute?

### Reporting Bugs

If you find a bug, unexpected behavior, or crash:
1. Check the [existing GitHub Issues](https://github.com/Aryan-Kumar-91/Neotic/issues) to ensure it hasn't already been reported.
2. If not, open a new issue with a clear and descriptive title.
3. Provide:
   - A clear description of the issue.
   - Exact steps to reproduce the behavior.
   - Expected vs. actual behavior.
   - Environment details (Browser, OS, Node.js version, Python version).
   - Relevant logs, screenshots, or screen recordings if applicable.

> [!NOTE]
> If you believe you have discovered a **security vulnerability**, please review our [SECURITY.md](SECURITY.md) and report it privately to the maintainers rather than creating a public issue.

### Suggesting Features & Enhancements

We are always eager to improve Neotic's reasoning visualization, DAG graph engine, and RAG pipelines:
1. Open an issue with the label `enhancement` or `feature request`.
2. Explain the motivation, use case, and expected outcome.
3. Provide mockups, sketches, or API design ideas if applicable.

### Submitting Code Changes

1. Pick an existing open issue or create one to discuss major architectural changes before investing significant implementation time.
2. Fork the repository and follow the setup guide below.
3. Follow our coding and commit conventions.
4. Verify that all automated checks pass locally before opening a Pull Request.

---

## Prerequisites & Development Setup

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v22.x or later ([Download Node.js](https://nodejs.org))
- **pnpm**: v11.x / v12.x (`npm install -g pnpm` or via Corepack)
- **Python**: 3.10+ ([Download Python](https://www.python.org))
- **Git**
- **API Keys**:
  - Google AI Studio API key (for Gemini 2.0 Flash)
  - Firebase Project credentials (for Authentication & Session Sync)

---

### Frontend Setup (Vite + React 19)

1. Clone your fork and enter the repository root:
   ```bash
   git clone https://github.com/<your-username>/Neotic.git
   cd Neotic
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment variables:
   ```bash
   # On Linux / macOS / WSL:
   cp .env.example .env.local

   # On Windows (PowerShell):
   Copy-Item .env.example .env.local
   ```
   Fill in your Firebase credentials in `.env.local`.

4. Start the frontend development server:
   ```bash
   pnpm dev
   ```
   The frontend runs by default at `http://localhost:3000`.

---

### Backend Setup (FastAPI + Python)

1. Navigate to the backend directory and set up a virtual environment:

   **Linux / macOS / WSL:**
   ```bash
   cd server
   python3 -m venv .venv
   source .venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt -r requirements-dev.txt
   ```

   **Windows (PowerShell):**
   ```powershell
   cd server
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install --upgrade pip
   pip install -r requirements.txt -r requirements-dev.txt
   ```

2. Configure backend environment:
   ```bash
   # On Linux / macOS / WSL:
   cp .env.example server/.env

   # On Windows (PowerShell):
   Copy-Item .env.example server\.env
   ```
   Populate your `GOOGLE_API_KEY` (Gemini) and backend configurations.

3. Start the backend server:
   ```bash
   python server.py
   ```
   The backend API runs at `http://localhost:8001`.

---

## Development Guidelines

### Frontend Conventions

- **Entry & Routing:**
  - Vite entry point is [`src/main.tsx`](src/main.tsx).
  - Route definitions are located in [`src/App.tsx`](src/App.tsx).
  - Use `react-router-dom` for client-side navigation.
  - Browser environment variables must use the `import.meta.env.VITE_*` prefix.
- **Separation of Concerns:**
  - Keep client bundle code strictly in `src/`.
  - Do not import backend code or server-side Python libraries into the frontend bundle.
- **Styling & Visualization:**
  - Use Tailwind CSS 4 utility classes for styling.
  - Flow diagrams and DAG visualizers are powered by `@xyflow/react` (`reactflow`). Keep node updates performant and memoized where appropriate.

### Backend Conventions

- **Architecture:**
  - Follow the MVC pattern under `server/src/` (`routes/`, `middlewares/`, `rag/`, etc.).
  - Keep endpoints asynchronous and maintain proper error handling with FastAPI `HTTPException`.
- **Code Style:**
  - Code must adhere to PEP 8.
  - Formatting is handled via **Black** (`black .`).
  - Linting is validated via **flake8** (max line length 100).
  - Write test cases under `server/tests/` or equivalent using **pytest**.

### Git Branching Strategy

Create branch names that reflect the scope and intention of the change:

- `feature/<feature-name>` for new features or major enhancements
- `fix/<bug-name>` for bug fixes
- `docs/<doc-topic>` for documentation improvements
- `refactor/<target>` for refactoring code without changing functionality
- `chore/<task>` for maintenance, dependencies, or build config

```bash
git checkout -b feature/visualizer-node-color
```

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short description>
```

Common types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (formatting, white-space)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process, dependency updates, or auxiliary tools

**Examples:**
- `feat(graph): add auto-layout toggle for reasoning DAG`
- `fix(auth): handle expired Firebase token gracefully`
- `docs: update CONTRIBUTING.md with backend setup instructions`
- `chore: update pnpm lockfile`

---

## Local Verification & Testing

Before submitting a pull request, run the CI checks locally to ensure a seamless review:

### Frontend Checks

From the project root:

```bash
# 1. Lint check
pnpm lint

# 2. TypeScript type check
pnpm exec tsc --noEmit

# 3. Production build verification
pnpm build
```

### Backend Checks

From the `server/` directory with virtual environment activated:

```bash
# 1. Check code formatting
black --check .

# 2. Check linting
flake8 . --count --max-complexity=10 --max-line-length=100 --statistics

# 3. Run test suite
pytest
```

---

## Pull Request Process

1. **Rebase or Sync:** Ensure your branch is rebased or up to date with `main` before opening the PR.
2. **Clear Description:**
   - Summarize the changes and the rationale behind them.
   - Mention the resolved issue(s) using keywords (e.g., `Fixes #123` or `Closes #456`).
   - Include before/after screenshots or GIFs for visual changes in the UI/DAG.
3. **CI Status:** Ensure all GitHub Actions CI checks (Frontend CI, Backend CI, CodeQL) pass successfully.
4. **Code Review:** Address any reviewer feedback or suggestions constructively.

---

## Need Help?

If you have questions or get stuck, feel free to reach out to the core maintainers:

- **Aryan Kumar**: [@memer0](https://github.com/memer0)
- **Tanmay Singh**: [@abhintr2006](https://github.com/abhintr2006)
- **Pranav**: [@toxicbishop](https://github.com/toxicbishop)

Happy coding, and thank you for helping build **Neotic**! 🚀
