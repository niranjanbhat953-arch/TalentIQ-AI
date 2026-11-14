@echo off
echo ========================================================
echo        TalentIQ AI - Starting Platform Services
echo ========================================================

echo.
echo [1/2] Starting Backend FastAPI Server on http://localhost:8000 ...
start "TalentIQ AI - Backend API" cmd /k "cd /d %~dp0backend && .\venv\Scripts\activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend Vite Server on http://localhost:5173 ...
start "TalentIQ AI - Frontend App" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo  All services launched!
echo  - Frontend: http://localhost:5173
echo  - Backend API: http://localhost:8000
echo  - Interactive Swagger Docs: http://localhost:8000/docs
echo ========================================================
echo.
pause
