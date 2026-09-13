@echo off
title Launching ALP Full Stack...
echo =====================================================================
echo   Starting ALP Full Stack: Server + Portal + Playground
echo =====================================================================

start "ALP Enterprise Server (:5000)" cmd /k "cd /d "%~dp0commercial\alp-server" && npm run dev:mongo"
timeout /t 3 >nul
start "ALP Enterprise Portal (:5174)" cmd /k "cd /d "%~dp0commercial\enterprise-app" && npm run dev"
start "ALP Monaco Playground (:5173)" cmd /k "cd /d "%~dp0playground" && npm run dev"

echo.
echo All services launched!
echo - API Server: http://localhost:5000
echo - Enterprise Portal: http://localhost:5174
echo - Monaco Playground: http://localhost:5173
echo.
exit /b 0
