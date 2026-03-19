import uvicorn
import os
import logging

# Configurar logging básico para el arranque
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("Iniciando S3 Parquet Explorer Backend...")
    
    # Configuración del servidor
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "True").lower() == "true"
    
    logger.info(f"Servidor configurado en http://{host}:{port} (Reload: {reload})")
    
    # Ejecutar uvicorn
    uvicorn.run("main:app", host=host, port=port, reload=reload)
