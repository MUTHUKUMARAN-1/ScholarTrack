@echo off
title ScholarTrack Frontend Server (Port 5173)
cd /d "%~dp0frontend"
echo ========================================================
echo   Starting ScholarTrack Frontend on http://localhost:5173
echo ========================================================
npm run dev -- --host 127.0.0.1 --port 5173
pause
