@echo off
setlocal

cd /d "%~dp0"

set "PORT=%~1"
set "RELOAD="
if /I "%PORT%"=="--reload" (
    set "PORT=8000"
    set "RELOAD=--reload"
)
if "%PORT%"=="" set "PORT=8000"
if /I "%~2"=="--reload" set "RELOAD=--reload"

set "VENV_PY=%~dp0.venv\Scripts\python.exe"

if not exist "%VENV_PY%" (
    echo Creating backend virtual environment...
    where py >nul 2>nul
    if errorlevel 1 (
        python -m venv .venv
    ) else (
        py -3 -m venv .venv
    )
    if errorlevel 1 (
        echo Failed to create .venv. Install Python 3.11+ and try again.
        exit /b 1
    )
)

"%VENV_PY%" -c "import fastapi, uvicorn, dotenv, pydantic, multipart" >nul 2>nul
if errorlevel 1 (
    echo Installing backend dependencies...
    "%VENV_PY%" -m pip install -r requirements.txt
    if errorlevel 1 exit /b 1
)

netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul 2>nul
if not errorlevel 1 (
    echo Port %PORT% is already in use.
    echo Stop the existing server or run: start_backend.cmd 8001
    exit /b 1
)

echo Starting CareLens backend on http://127.0.0.1:%PORT%
if defined RELOAD echo Reload mode is enabled.
"%VENV_PY%" run_backend.py --host 127.0.0.1 --port %PORT% %RELOAD%
