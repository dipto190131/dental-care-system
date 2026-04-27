@echo off
REM DentalCare System - Complete Setup and Run
REM This script runs setup.ps1 first, then start-local.ps1

echo ========================================
echo  DentalCare System - Complete Setup
echo ========================================
echo.

REM Run setup script
echo Running setup...
powershell -ExecutionPolicy Bypass -File "%~dp0setup.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Setup failed! Please check the errors above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Setup completed successfully!
echo.
echo ========================================
echo  Starting Application...
echo ========================================
echo.

REM Start the application in a new window
start "DentalCare System" powershell -ExecutionPolicy Bypass -File "%~dp0start-local.ps1"

REM Wait for servers to start
echo Waiting for servers to start...
timeout /t 8 /nobreak >nul

REM Open pgAdmin (PostgreSQL database management tool)
echo Opening database management tool...
if exist "%ProgramFiles%\pgAdmin 4\v8\runtime\pgAdmin4.exe" (
    start "" "%ProgramFiles%\pgAdmin 4\v8\runtime\pgAdmin4.exe"
) else if exist "%ProgramFiles%\pgAdmin 4\v7\runtime\pgAdmin4.exe" (
    start "" "%ProgramFiles%\pgAdmin 4\v7\runtime\pgAdmin4.exe"
) else if exist "%ProgramFiles%\pgAdmin 4\runtime\pgAdmin4.exe" (
    start "" "%ProgramFiles%\pgAdmin 4\runtime\pgAdmin4.exe"
) else if exist "%ProgramFiles(x86)%\pgAdmin 4\runtime\pgAdmin4.exe" (
    start "" "%ProgramFiles(x86)%\pgAdmin 4\runtime\pgAdmin4.exe"
) else (
    echo pgAdmin not found. You can manually open your database tool.
)

REM Open browser
echo Opening browser...
start http://localhost:5000

echo.
echo Application is running!
echo Browser should open automatically to http://localhost:5000
echo.
echo To stop the application, close the "DentalCare System" window.
echo.
pause
