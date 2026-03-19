@echo off
echo ========================================
echo    S3 PARQUET EXPLORER - INICIADOR COMPATIBLE
echo ========================================
echo.
echo Este script inicia la aplicacion S3 Parquet Explorer
echo Backend: FastAPI en http://localhost:8000
echo Frontend: React en http://localhost:3000
echo.

REM Verificar que estamos en el directorio correcto
if not exist "backend\main.py" (
    echo ERROR: No se encuentra el archivo backend\main.py
    echo Ejecuta este script desde el directorio raiz del proyecto
    echo Directorio actual: %cd%
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ERROR: No se encuentra el archivo frontend\package.json
    echo Ejecuta este script desde el directorio raiz del proyecto
    echo Directorio actual: %cd%
    pause
    exit /b 1
)

echo [1/5] Verificando instalacion del backend...
cd backend

if not exist "venv" (
    echo.
    echo ERROR: Backend no instalado
    echo.
    echo EJECUTA PRIMERO uno de estos scripts:
    echo 1. install_backend_compatible.bat (RECOMENDADO)
    echo 2. install_backend.bat
    echo.
    echo Luego vuelve a ejecutar start.bat
    echo.
    pause
    exit /b 1
)

echo Activando entorno virtual...
call venv\Scripts\activate
if errorlevel 1 (
    echo ERROR: No se pudo activar el entorno virtual
    echo.
    echo SOLUCION: Ejecuta install_backend_compatible.bat primero
    pause
    exit /b 1
)

REM Verificar dependencias basicas
echo Verificando dependencias basicas...
python -c "import fastapi, boto3, pandas; print('Dependencias basicas: OK')" 2>nul
if errorlevel 1 (
    echo.
    echo ADVERTENCIA: Algunas dependencias pueden faltar
    echo La aplicacion puede funcionar con funcionalidades limitadas
    echo.
    echo Presiona cualquier tecla para continuar...
    pause >nul
)

cd ..

echo.
echo [2/5] Verificando instalacion del frontend...
cd frontend

if not exist "node_modules" (
    echo.
    echo ADVERTENCIA: Frontend no instalado
    echo Instalando dependencias de Node.js...
    echo Esto puede tomar unos minutos...
    echo.
    npm install
    if errorlevel 1 (
        echo ERROR: No se pudieron instalar las dependencias del frontend
        echo Asegurate de tener Node.js 16+ instalado
        echo Descarga desde: https://nodejs.org/
        pause
        exit /b 1
    )
) else (
    echo Frontend ya instalado
)

cd ..

echo.
echo [3/5] Verificando credenciales AWS...
echo.
echo NOTA: La aplicacion usara las credenciales AWS de:
echo 1. Variables de entorno del sistema (recomendado)
echo 2. Archivo backend\.env (si existe)
echo.

REM Verificar variables de entorno basicas
set AWS_ACCESS_KEY_ID >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Variable AWS_ACCESS_KEY_ID no encontrada en variables de sistema
) else (
    echo ✓ Variable AWS_ACCESS_KEY_ID encontrada
)

set AWS_SECRET_ACCESS_KEY >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Variable AWS_SECRET_ACCESS_KEY no encontrada en variables de sistema
) else (
    echo ✓ Variable AWS_SECRET_ACCESS_KEY encontrada
)

REM Verificar archivo .env
if exist "backend\.env" (
    echo ✓ Archivo backend\.env encontrado
) else (
    echo ⚠️  Archivo backend\.env no encontrado
    echo    Creando archivo de configuracion basico...
    copy backend\.env.example backend\.env >nul 2>&1
    if errorlevel 0 (
        echo ✓ Archivo backend\.env creado
        echo   Editalo para configurar credenciales si es necesario
    )
)

echo.
echo [4/5] Iniciando servicios...
echo.

REM Iniciar backend en una nueva ventana
echo Iniciando BACKEND (FastAPI)...
echo URL: http://localhost:8000
echo Documentacion: http://localhost:8000/docs
echo Health Check: http://localhost:8000/health
echo.
echo Esta ventana se mantendra abierta para mostrar logs del backend
echo.
start "S3 Parquet Explorer - Backend" cmd /k "cd /d %cd%\backend && call venv\Scripts\activate && python run.py"

REM Esperar a que el backend inicie
echo Esperando 15 segundos para que el backend se inicie completamente...
echo Por favor espera...
timeout /t 15 /nobreak >nul

echo.
echo [5/5] Iniciando FRONTEND (React)...
echo URL: http://localhost:3000
echo.
echo Esta ventana se mantendra abierta para mostrar logs del frontend
echo.
start "S3 Parquet Explorer - Frontend" cmd /k "cd /d %cd%\frontend && npm start"

echo.
echo ========================================
echo    APLICACION INICIADA EXITOSAMENTE
echo ========================================
echo.
echo ✅ BACKEND: http://localhost:8000
echo ✅ FRONTEND: http://localhost:3000
echo.
echo 📋 ACCESOS RAPIDOS:
echo - Aplicacion: http://localhost:3000
echo - Documentacion API: http://localhost:8000/docs
echo - Health Check: http://localhost:8000/health
echo - Redoc: http://localhost:8000/redoc
echo.
echo 🔧 SOLUCION DE PROBLEMAS:
echo 1. Si la pagina no carga, espera 30 segundos y recarga
echo 2. Verifica que ambos servicios esten corriendo
echo 3. Revisa las ventanas de consola para errores
echo.
echo 🚀 Presiona cualquier tecla para abrir la aplicacion en el navegador...
pause >nul

start http://localhost:3000

echo.
echo ========================================
echo    INFORMACION IMPORTANTE
echo ========================================
echo.
echo 📌 PARA DETENER LA APLICACION:
echo 1. Cierra las ventanas de comandos abiertas (Backend y Frontend)
echo 2. O presiona Ctrl+C en cada ventana
echo.
echo 🔄 PARA REINICIAR:
echo 1. Deten la aplicacion (paso anterior)
echo 2. Ejecuta este script nuevamente
echo.
echo 🐛 SI HAY PROBLEMAS:
echo 1. Verifica que Python 3.8+ y Node.js 16+ esten instalados
echo 2. Ejecuta install_backend_compatible.bat si hay errores de dependencias
echo 3. Verifica tus credenciales AWS
echo.
echo 📞 SOPORTE:
echo - Backend: Revisa la ventana de consola del backend
echo - Frontend: Revisa la ventana de consola del frontend
echo - Navegador: Presiona F12 para herramientas de desarrollo
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
