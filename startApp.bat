@echo off
echo ==========================================
echo   S3 PARQUET EXPLORER - INICIO GLOBAL
echo ==========================================

REM Cambiar al directorio del script
cd /d "%~dp0"

REM Iniciar Backend en una nueva ventana
echo [1/2] Iniciando Backend...
start "S3 Parquet Explorer - Backend" cmd /c "cd backend && start_backend.bat"

REM Iniciar Frontend en una nueva ventana
echo [2/2] Iniciando Frontend...
REM El puerto se establece dentro de start_frontend.bat, pero lo aseguramos aquí también
set PORT=3000
start "S3 Parquet Explorer - Frontend" cmd /c "cd frontend && start_frontend.bat"

echo.
echo ==========================================
echo   SERVICIOS INICIADOS
echo ==========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Los servicios se estan iniciando en ventanas separadas. 
echo Esta ventana se cerrara automaticamente...
timeout /t 3 /nobreak >nul
exit
