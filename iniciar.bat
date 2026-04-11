@echo off
title CDR - Iniciando...
color 0A

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%front-tex"

set "NODE_PATHS=C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%APPDATA%\npm"
set "PATH=%PATH%;%NODE_PATHS%"

echo.
echo  =========================================
echo    CDR - Sistema de Analisis
echo  =========================================
echo.
echo  Backend:  %BACKEND%
echo  Frontend: %FRONTEND%
echo.

:: ---- Backend ----
echo  Iniciando backend...
start "CDR - Backend" cmd /k "set PATH=%PATH% && cd /d "%BACKEND%" && npm run start:dev"

:: ---- Esperar ----
timeout /t 12 /nobreak >nul

:: ---- Frontend ----
echo  Iniciando frontend...
start "CDR - Frontend" cmd /k "set PATH=%PATH% && cd /d "%FRONTEND%" && npm run dev"

:: ---- Esperar y abrir browser ----
timeout /t 6 /nobreak >nul
echo  Abriendo navegador...
start http://localhost:5173

echo.
echo  Sistema iniciado. Podes cerrar esta ventana.
echo.
pause
