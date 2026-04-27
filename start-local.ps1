# PowerShell script to start DentalCare System locally
# Usage: .\start-local.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  DentalCare System - Local Dev  " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables from .env file
if (Test-Path .env) {
    Write-Host "[INFO] Loading environment variables from .env file..." -ForegroundColor Green
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "[WARNING] .env file not found. Using default settings..." -ForegroundColor Yellow
}

# Check if PostgreSQL is accessible
Write-Host "[INFO] Checking PostgreSQL connection..." -ForegroundColor Green
$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) {
    Write-Host "[WARNING] DATABASE_URL not set in .env file" -ForegroundColor Yellow
    Write-Host "[INFO] Will use SQLite as fallback" -ForegroundColor Yellow
}

# Navigate to backend directory and run migrations
Write-Host ""
Write-Host "==> Running Django migrations (session table)..." -ForegroundColor Cyan
Set-Location backend
python manage.py migrate --run-syncdb

Write-Host ""
Write-Host "==> Initializing database tables and seed data..." -ForegroundColor Cyan
python manage.py initdb

# Start Django server in a new terminal window
Write-Host ""
Write-Host "==> Starting Django API server on port 8000..." -ForegroundColor Cyan
Write-Host "    (Django will start in a new terminal window)" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python manage.py runserver 0.0.0.0:8000"

# Wait a moment for Django to start
Start-Sleep -Seconds 4

# Navigate back to root
Set-Location ..

# Start Express + Vite server
Write-Host ""
Write-Host "==> Starting Express + Vite frontend server on port 5000..." -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Application Running!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5000" -ForegroundColor Green
Write-Host "  Backend API: http://localhost:8000/api" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

try {
    npm run dev
} finally {
    # Cleanup: Django will stop when its terminal is closed
    Write-Host ""
    Write-Host "==> Frontend server stopped. You can close the Django terminal when done." -ForegroundColor Yellow
    Write-Host "[INFO] All servers stopped." -ForegroundColor Green
}
