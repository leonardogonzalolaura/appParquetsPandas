@echo off
echo ==========================================
echo   S3 PARQUET EXPLORER - INICIANDO FRONTEND
echo ==========================================

cd /d "%~dp0"

echo [1/2] Verificando dependencias (node_modules)...
IF NOT EXIST node_modules (
    echo [!] No se encontro la carpeta node_modules. Instalando...
    call npm install
) ELSE (
    echo [OK] Dependencias instaladas.
)

echo [2/2] Iniciando aplicacion frontend...
echo La aplicación se abrira en su navegador (habitualmente http://localhost:3000)
call npm start

pause
