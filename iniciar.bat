@echo off
title CDR - Iniciando sistema...
color 0A

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%front-tex"

echo.
echo  =========================================
echo    CDR - Sistema de Analisis
echo  =========================================
echo.

:: ---- Verificar Node.js ----
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js no esta instalado.
    echo.
    echo  Por favor instale Node.js desde:
    echo  https://nodejs.org  (version LTS recomendada)
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% detectado
echo.

:: ---- Instalar dependencias si faltan ----
if not exist "%BACKEND%\node_modules" (
    echo  Instalando dependencias del backend, espere...
    cd /d "%BACKEND%"
    call npm install --silent
    echo  [OK] Backend listo
    echo.
)

if not exist "%FRONTEND%\node_modules" (
    echo  Instalando dependencias del frontend, espere...
    cd /d "%FRONTEND%"
    call npm install --silent
    echo  [OK] Frontend listo
    echo.
)

:: ---- Iniciar backend ----
echo  Iniciando backend...
start "CDR - Backend" cmd /k "color 0B && echo CDR Backend corriendo en puerto 3001 && echo. && cd /d "%BACKEND%" && npm run start:dev"

:: Esperar que el backend levante
echo  Esperando que el backend inicie...
timeout /t 12 /nobreak >nul

:: ---- Iniciar frontend ----
echo  Iniciando frontend...
start "CDR - Frontend" cmd /k "color 0D && echo CDR Frontend corriendo en puerto 5173 && echo. && cd /d "%FRONTEND%" && npm run dev"

:: Esperar que el frontend levante
timeout /t 6 /nobreak >nul

:: ---- Abrir navegador ----
echo  Abriendo navegador...
start http://localhost:5173

echo.
echo  =========================================
echo    Sistema iniciado correctamente
echo    Accede en: http://localhost:5173
echo  =========================================
echo.
echo  Para detener el sistema cerrá las ventanas:
echo    - "CDR - Backend"
echo    - "CDR - Frontend"
echo.
pause
