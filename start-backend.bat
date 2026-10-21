@echo off
title ScholarTrack Backend Server (Port 8000)
cd /d "%~dp0backend"
echo ========================================================
echo   Starting ScholarTrack Backend API on http://localhost:8000
echo ========================================================
venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
