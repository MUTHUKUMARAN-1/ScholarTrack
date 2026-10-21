@echo off
title ScholarTrack Launcher
echo ========================================================
echo   Launching ScholarTrack Full-Stack Application...
echo ========================================================
echo Starting Backend API on http://localhost:8000 ...
start "ScholarTrack Backend" cmd /k "%~dp0start-backend.bat"

echo Waiting 3 seconds for Backend to initialize...
timeout /t 3 /nobreak >nul

echo Starting Frontend on http://localhost:5173 ...
start "ScholarTrack Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo ========================================================
echo   ScholarTrack is launching!
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/api/docs
echo ========================================================
timeout /t 2 >nul
start http://localhost:5173
