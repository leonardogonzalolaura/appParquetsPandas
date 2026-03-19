@echo off
echo ==========================================
echo   S3 PARQUET EXPLORER - INICIANDO BACKEND
echo ==========================================

cd /d "%~dp0"

IF EXIST venv\Scripts\activate (
    echo [1/2] Activando entorno virtual...
    call venv\Scripts\activate
) ELSE (
    echo [!] Advertencia: No se encontro la carpeta venv.
    echo Intentando ejecutar con el Python del sistema...
)

echo [2/2] Iniciando servidor...
python run.py

pause
