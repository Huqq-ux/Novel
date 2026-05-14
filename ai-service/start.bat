@echo off
echo ========================================
echo  Novel AI Agent Service - Startup
echo ========================================

cd /d "%~dp0"

if not exist ".env" (
    echo [WARN] .env file not found, copying from .env.example...
    copy .env.example .env
    echo [INFO] Please edit .env file with your configuration before starting.
    echo.
)

if not exist "venv" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo [INFO] Installing dependencies...
    pip install -r requirements.txt -q
) else (
    call venv\Scripts\activate.bat
)

echo [INFO] Starting AI Agent Service on port 8001...
echo [INFO] API Docs: http://localhost:8001/docs
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
