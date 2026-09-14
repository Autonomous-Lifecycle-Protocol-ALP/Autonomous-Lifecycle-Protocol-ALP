@echo off
setlocal
title Launching SHAM Desktop IDE...

set "SCRIPT_DIR=%~dp0"
set "UNPACKED_EXE=%SCRIPT_DIR%sham\dist-installer\win-unpacked\SHAM.exe"

if "%1"=="--dev" goto :run_dev
if "%1"=="-d" goto :run_dev

if exist "%UNPACKED_EXE%" (
    echo [SHAM] Launching standalone application...
    start "" "%UNPACKED_EXE%"
    exit /b 0
)

:run_dev
echo [SHAM] Launching in developer mode...
cd /d "%SCRIPT_DIR%sham"
set ELECTRON_RUN_AS_NODE=
echo [SHAM] Building components...
call npm run build
echo [SHAM] Starting Electron Desktop App...
start "" npx electron .
exit /b 0
