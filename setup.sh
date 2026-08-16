#!/usr/bin/env bash

#  Neotic - Environment Setup Script
#  Run this once to set up your full development environment.
#  Compatible with: macOS, Linux, WSL

set -e

# ---- Colours ----------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

log()    { echo -e "${CYAN}[setup]${RESET} $1"; }
ok()     { echo -e "${GREEN}[ok]${RESET}    $1"; }
warn()   { echo -e "${YELLOW}[warn]${RESET}  $1"; }
error()  { echo -e "${RED}[error]${RESET} $1"; exit 1; }

echo ""
echo -e "${BOLD}=================================================${RESET}"
echo -e "${BOLD}  Neotic - Development Environment Setup${RESET}"
echo -e "${BOLD}=================================================${RESET}"
echo ""

#  1. NODE.JS — Required: v22.x
log "Checking Node.js version..."

REQUIRED_NODE_MAJOR=22

if ! command -v node &>/dev/null; then
    error "Node.js is not installed. Please install Node.js v${REQUIRED_NODE_MAJOR} from https://nodejs.org and re-run this script."
fi

NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")

if [ "$NODE_MAJOR" -ne "$REQUIRED_NODE_MAJOR" ]; then
    error "Node.js v${REQUIRED_NODE_MAJOR}.x is required, but you have v$(node --version). Use a version manager like nvm: nvm install 22 && nvm use 22"
fi

ok "Node.js $(node --version) detected."

#  2. PNPM — Required: v11.x (package manager)
log "Checking pnpm..."

REQUIRED_PNPM_MAJOR=11

if ! command -v pnpm &>/dev/null; then
    log "pnpm not found. Installing via corepack..."
    corepack enable
    corepack prepare pnpm@11.18.0 --activate
fi

PNPM_MAJOR=$(pnpm --version | cut -d. -f1)

if [ "$PNPM_MAJOR" -ne "$REQUIRED_PNPM_MAJOR" ]; then
    warn "pnpm v${REQUIRED_PNPM_MAJOR}.x is recommended, but you have v$(pnpm --version)."
    warn "To switch: corepack prepare pnpm@11.18.0 --activate"
fi

ok "pnpm $(pnpm --version) detected."

#  3. PYTHON — Required: 3.10 or newer
log "Checking Python version..."

REQUIRED_PYTHON_MAJOR=3
REQUIRED_PYTHON_MINOR=10

if ! command -v python3 &>/dev/null; then
    error "Python 3 is not installed. Please install Python 3.10+ from https://www.python.org"
fi

PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)

if [ "$PYTHON_MAJOR" -lt "$REQUIRED_PYTHON_MAJOR" ] || [ "$PYTHON_MINOR" -lt "$REQUIRED_PYTHON_MINOR" ]; then
    error "Python ${REQUIRED_PYTHON_MAJOR}.${REQUIRED_PYTHON_MINOR}+ is required, but you have Python ${PYTHON_VERSION}."
fi

ok "Python ${PYTHON_VERSION} detected."

#  4. FRONTEND — Install Node dependencies
log "Installing frontend dependencies (this may take a moment)..."

# Remove stale artifacts
if [ -d "node_modules" ]; then
    warn "Removing existing node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    warn "Removing stray package-lock.json (this project uses pnpm)..."
    rm -f package-lock.json
fi

pnpm install --frozen-lockfile

ok "Frontend dependencies installed."

#  5. BACKEND — Create virtualenv and install Python dependencies
log "Setting up Python virtual environment in ./server/.venv..."

cd server

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

# Activate venv
# shellcheck source=/dev/null
# shellcheck disable=SC1091
source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null || true

log "Installing Python dependencies..."
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet

ok "Python dependencies installed."

deactivate
cd ..

#  6. ENV FILES — Check for required environment files
echo ""
log "Checking environment configuration..."

MISSING_ENV=0

if [ ! -f ".env.local" ]; then
    warn ".env.local not found in root. Copy .env.example -> .env.local and fill in your Firebase + Gemini keys."
    MISSING_ENV=1
fi

if [ ! -f "server/.env" ]; then
    warn "server/.env not found. Copy .env.example -> server/.env and fill in your keys."
    MISSING_ENV=1
fi

if [ "$MISSING_ENV" -eq 0 ]; then
    ok "Environment files detected."
fi

#  Done
echo ""
echo -e "${BOLD}=================================================${RESET}"
echo -e "${GREEN}${BOLD}  Setup complete.${RESET}"
echo -e "${BOLD}=================================================${RESET}"
echo ""
echo -e "  Start the ${BOLD}frontend${RESET}:  pnpm dev"
echo -e "  Start the ${BOLD}backend${RESET}:   cd server && source .venv/bin/activate && python server.py"
echo ""
