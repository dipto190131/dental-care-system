# PowerShell script to install all dependencies for DentalCare System
# Usage: .\setup.ps1

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  DentalCare System - Setup Script   " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "[1/5] Checking Python installation..." -ForegroundColor Green
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  Found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  Python not found! Please install Python 3.13+ first." -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host ""
Write-Host "[2/5] Checking Node.js installation..." -ForegroundColor Green
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  Found: Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  Node.js not found! Please install Node.js 22+ first." -ForegroundColor Red
    exit 1
}

# Install Python dependencies
Write-Host ""
Write-Host "[3/5] Installing Python dependencies..." -ForegroundColor Green
pip install -r requirements.txt
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Python dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "  Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}

# Install Node.js dependencies
Write-Host ""
Write-Host "[4/5] Installing Node.js dependencies..." -ForegroundColor Green
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Node.js dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "  Failed to install Node.js dependencies" -ForegroundColor Red
    exit 1
}

# Check .env file
Write-Host ""
Write-Host "[5/5] Checking configuration..." -ForegroundColor Green
if (Test-Path .env) {
    Write-Host "  .env file found" -ForegroundColor Green
} else {
    Write-Host "  .env file not found. Creating from template..." -ForegroundColor Yellow
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Host "  Created .env from .env.example" -ForegroundColor Green
        Write-Host "  IMPORTANT: Edit .env file and update DATABASE_URL with your PostgreSQL credentials!" -ForegroundColor Yellow
    } else {
        Write-Host "  .env.example not found!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  Setup Complete!                    " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Ensure PostgreSQL is installed and running" -ForegroundColor White
Write-Host "2. Create a database: CREATE DATABASE dentalcare;" -ForegroundColor White
Write-Host "3. Update .env file with your PostgreSQL credentials" -ForegroundColor White
Write-Host "4. Run: .\start-local.ps1" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see README-LOCAL-SETUP.md" -ForegroundColor Gray
Write-Host ""
