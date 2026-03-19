@echo off
echo ========================================
echo    INSTALACION BACKEND S3 PARQUET EXPLORER
echo ========================================
echo.

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no encontrado
    echo Instala Python 3.8 o superior desde: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/4] Creando entorno virtual...
if not exist "venv" (
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: No se pudo crear el entorno virtual
        echo Asegurate de tener Python instalado correctamente
        pause
        exit /b 1
    )
    echo Entorno virtual creado exitosamente
) else (
    echo Entorno virtual ya existe
)

echo.
echo [2/4] Activando entorno virtual...
call venv\Scripts\activate
if errorlevel 1 (
    echo ERROR: No se pudo activar el entorno virtual
    pause
    exit /b 1
)

echo.
echo [3/4] Actualizando pip...
python -m pip install --upgrade pip
if errorlevel 1 (
    echo ADVERTENCIA: No se pudo actualizar pip, continuando...
)

echo.
echo [4/4] Instalando dependencias...
echo Instalando dependencias basicas...
python -m pip install fastapi==0.104.1 uvicorn[standard]==0.24.0 boto3==1.34.0
if errorlevel 1 (
    echo ERROR: Fallo la instalacion de dependencias basicas
    pause
    exit /b 1
)

echo Instalando pandas y numpy...
python -m pip install pandas==2.1.3 numpy==1.26.2
if errorlevel 1 (
    echo ERROR: Fallo la instalacion de pandas/numpy
    pause
    exit /b 1
)

echo Instalando pyarrow (esto puede tomar unos minutos)...
python -m pip install pyarrow==14.0.1 --no-build-isolation
if errorlevel 1 (
    echo ADVERTENCIA: Intentando instalar version alternativa de pyarrow...
    python -m pip install pyarrow --no-build-isolation
)

echo Instalando dependencias restantes...
python -m pip install python-multipart==0.0.6 pydantic==2.5.0 python-dotenv==1.0.0
python -m pip install aiofiles==23.2.1 plotly==5.18.0 pydantic-settings==2.1.0
if errorlevel 1 (
    echo ADVERTENCIA: Algunas dependencias no se instalaron completamente
)

echo.
echo ========================================
echo    INSTALACION COMPLETADA
echo ========================================
echo.
echo Para iniciar el backend:
echo 1. Asegurate de estar en el directorio backend
echo 2. Activa el entorno virtual: call venv\Scripts\activate
echo 3. Ejecuta: python run.py
echo.
echo O usa el script start.bat desde el directorio raiz
echo.
pause
