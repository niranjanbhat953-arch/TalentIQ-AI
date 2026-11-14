Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       TalentIQ AI - Starting Platform Services        " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

Write-Host "`n[1/2] Starting Backend FastAPI Server on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting Frontend Vite Server on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " All services launched successfully!" -ForegroundColor Green
Write-Host " - Frontend:         http://localhost:5173" -ForegroundColor Green
Write-Host " - Backend API:      http://localhost:8000" -ForegroundColor Green
Write-Host " - API Swagger Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "========================================================`n" -ForegroundColor Green
