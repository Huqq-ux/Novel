#!/bin/bash
echo "========================================"
echo " Novel AI Agent Service - Startup"
echo "========================================"

cd "$(dirname "$0")"

if [ ! -f ".env" ]; then
    echo "[WARN] .env file not found, copying from .env.example..."
    cp .env.example .env
    echo "[INFO] Please edit .env file with your configuration before starting."
    echo
fi

if [ ! -d "venv" ]; then
    echo "[INFO] Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "[INFO] Installing dependencies..."
    pip install -r requirements.txt -q
else
    source venv/bin/activate
fi

echo "[INFO] Starting AI Agent Service on port 8001..."
echo "[INFO] API Docs: http://localhost:8001/docs"
echo
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
