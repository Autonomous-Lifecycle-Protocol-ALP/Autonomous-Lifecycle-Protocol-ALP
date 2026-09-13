@echo off
setlocal EnableDelayedExpansion
title ALP Monorepo Launcher

:menu
cls
echo =====================================================================
echo   AUTONOMOUS LIFECYCLE PROTOCOL (ALP) - DEVELOPER LAUNCHER
echo =====================================================================
echo.
echo   [1] Launch SHAM Desktop IDE (Standalone / Instant)
echo   [2] Launch SHAM Desktop IDE (Developer Mode)
echo   [3] Launch Enterprise Server (API & In-Memory MongoDB :5000)
echo   [4] Launch Enterprise Web Portal (React Web UI :5174)
echo   [5] Launch Monaco Web Playground (:5173)
echo   [6] Launch Documentation Site (:5173/docs)
echo   [7] Launch Full Stack (Server + Enterprise Portal + Playground)
echo   [8] Run Complete Monorepo Test Suite (npm test)
echo   [9] Build Standalone Desktop Binary (Package SHAM)
echo   [0] Exit
echo.
echo =====================================================================
set /p choice="Select an option [0-9]: "

if "%choice%"=="1" goto :opt_sham_standalone
if "%choice%"=="2" goto :opt_sham_dev
if "%choice%"=="3" goto :opt_server
if "%choice%"=="4" goto :opt_portal
if "%choice%"=="5" goto :opt_playground
if "%choice%"=="6" goto :opt_docs
if "%choice%"=="7" goto :opt_fullstack
if "%choice%"=="8" goto :opt_test
if "%choice%"=="9" goto :opt_package
if "%choice%"=="0" exit /b 0

echo Invalid choice, try again.
timeout /t 2 >nul
goto :menu

:opt_sham_standalone
call "%~dp0launch-sham.bat"
goto :menu

:opt_sham_dev
call "%~dp0launch-sham.bat" --dev
goto :menu

:opt_server
echo Starting Enterprise Server (:5000)...
start "ALP Enterprise Server (:5000)" cmd /k "cd /d "%~dp0commercial\alp-server" && npm run dev:mongo"
goto :menu

:opt_portal
echo Starting Enterprise Web Portal (:5174)...
start "ALP Enterprise Portal (:5174)" cmd /k "cd /d "%~dp0commercial\enterprise-app" && npm run dev"
goto :menu

:opt_playground
echo Starting Monaco Web Playground (:5173)...
start "ALP Monaco Playground (:5173)" cmd /k "cd /d "%~dp0playground" && npm run dev"
goto :menu

:opt_docs
echo Starting Documentation Site...
start "ALP Docs Site" cmd /k "cd /d "%~dp0docs-site" && npm run dev"
goto :menu

:opt_fullstack
echo Starting Full Stack Services...
start "ALP Enterprise Server (:5000)" cmd /k "cd /d "%~dp0commercial\alp-server" && npm run dev:mongo"
timeout /t 3 >nul
start "ALP Enterprise Portal (:5174)" cmd /k "cd /d "%~dp0commercial\enterprise-app" && npm run dev"
start "ALP Monaco Playground (:5173)" cmd /k "cd /d "%~dp0playground" && npm run dev"
goto :menu

:opt_test
echo Running monorepo tests...
call npm test
pause
goto :menu

:opt_package
echo Packaging SHAM standalone executable...
call npm run package:sham
pause
goto :menu
