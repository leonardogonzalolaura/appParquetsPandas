import io
import json
import logging
import os
import traceback
from datetime import datetime
from typing import Any, Dict, List, Optional

import boto3
import pandas as pd
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

# Intentar importar pyarrow, pero continuar si no está disponible
try:
    import pyarrow.parquet as pq

    PYARROW_AVAILABLE = True
except ImportError:
    PYARROW_AVAILABLE = False
    print(
        "ADVERTENCIA: pyarrow no está instalado. Algunas funciones de Parquet estarán limitadas."
    )

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()

app = FastAPI(
    title="S3 Parquet Explorer API",
    description="API para explorar y analizar archivos Parquet en Amazon S3",
    version="1.0.0",
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Configurar cliente S3 usando la cadena de resolución de credenciales de boto3
def get_s3_client():
    """Obtener cliente S3 usando resolución automática de credenciales"""
    try:
        # Usar resolución automática de credenciales de boto3
        # Esto buscará en: 1) Parámetros explícitos, 2) Variables de entorno,
        # 3) Archivo ~/.aws/credentials, 4) IAM roles (EC2/ECS)
        session = boto3.Session(region_name=os.getenv("AWS_REGION", "us-east-1"))

        # Verificar si las credenciales están disponibles
        credentials = session.get_credentials()
        if credentials is None:
            logger.warning(
                "No se encontraron credenciales AWS. Verifica tu configuración."
            )
            logger.info(
                "Buscando en variables de entorno: AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY"
            )

        # Crear cliente S3
        s3_client = session.client("s3")

        # Verificar que el cliente se creó correctamente
        logger.info(f"Cliente S3 creado en región: {session.region_name}")
        return s3_client

    except Exception as e:
        logger.error(f"Error al crear cliente S3: {e}")
        logger.error(
            "Asegúrate de que las credenciales AWS estén configuradas correctamente."
        )
        logger.error(
            "Puedes configurarlas como variables de entorno o en ~/.aws/credentials"
        )
        raise HTTPException(
            status_code=500, detail=f"Error de configuración AWS: {str(e)}"
        )


class S3File(io.RawIOBase):
    """
    Clase que implementa una interfaz similar a un archivo para un objeto de S3
    utilizando solicitudes de rango (Range Requests).
    Permite a pyarrow leer solo las partes necesarias del archivo (como el footer de Parquet).
    """
    def __init__(self, s3_client, bucket, key):
        self.s3_client = s3_client
        self.bucket = bucket
        self.key = key
        self.pos = 0
        self._size = None

    @property
    def size(self):
        if self._size is None:
            response = self.s3_client.head_object(Bucket=self.bucket, Key=self.key)
            self._size = response['ContentLength']
        return self._size

    def readable(self):
        return True

    def seekable(self):
        return True

    def seek(self, offset, whence=io.SEEK_SET):
        if whence == io.SEEK_SET:
            self.pos = offset
        elif whence == io.SEEK_CUR:
            self.pos += offset
        elif whence == io.SEEK_END:
            self.pos = self.size + offset
        else:
            raise ValueError("Valor de 'whence' inválido")
        return self.pos

    def tell(self):
        return self.pos

    def read(self, size=-1):
        if size == 0:
            return b""
        
        # Si size es -1, leer hasta el final
        if size == -1 or self.pos + size > self.size:
            size = self.size - self.pos

        if size <= 0:
            return b""

        end_pos = self.pos + size - 1
        range_header = f"bytes={self.pos}-{end_pos}"
        
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket, Key=self.key, Range=range_header
            )
            data = response['Body'].read()
            self.pos += len(data)
            return data
        except Exception as e:
            logger.error(f"Error leyendo rango {range_header} de S3: {e}")
            return b""


# Modelos de datos
class BucketInfo(BaseModel):
    name: str
    creation_date: str
    object_count: Optional[int] = None
    size_gb: Optional[float] = None


class S3Object(BaseModel):
    key: str
    name: str
    last_modified: str
    size: int
    size_mb: float
    type: str = "file"  # "file" or "folder"
    etag: Optional[str] = None
    is_folder: bool = False


class ParquetMetadata(BaseModel):
    columns: List[str]
    num_columns: Optional[int] = None
    row_count: int
    num_rows: Optional[int] = None
    file_size: int
    schema: Dict[str, Any]
    created_at: Optional[str] = None
    format_version: str = "1.0"


class ParquetDataRequest(BaseModel):
    bucket: str
    key: str
    limit: int = 100
    columns: Optional[List[str]] = None
    filters: Optional[Dict[str, Any]] = None


class CopyObjectRequest(BaseModel):
    source_bucket: str
    source_key: str
    dest_bucket: str
    dest_key: str


class BulkCopyRequest(BaseModel):
    source_bucket: str
    source_keys: List[str]
    dest_bucket: str
    dest_path: str  # Solo el prefijo/carpeta de destino


# Rutas de la API
@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "S3 Parquet Explorer API",
        "version": "1.0.0",
        "endpoints": {
            "buckets": "/api/buckets",
            "objects": "/api/buckets/{bucket}/objects",
            "parquet_metadata": "/api/parquet/metadata",
            "parquet_data": "/api/parquet/data",
            "download": "/api/download",
        },
    }


@app.get("/api/buckets", response_model=List[BucketInfo])
async def list_buckets(s3_client=Depends(get_s3_client)):
    """Listar buckets S3 definidos en la variable de entorno S3_PREDEFINED_BUCKETS"""
    # Leer los buckets desde .env — edita S3_PREDEFINED_BUCKETS para personalizar
    raw_buckets = os.getenv("S3_PREDEFINED_BUCKETS", "")
    predefined_buckets = [b.strip() for b in raw_buckets.split(",") if b.strip()]

    if not predefined_buckets:
        logger.warning(
            "La variable S3_PREDEFINED_BUCKETS no está configurada en el archivo .env. "
            "Agrega tus buckets separados por coma."
        )

    try:
        buckets = []

        for bucket_name in predefined_buckets:
            try:
                # Verificar si el bucket existe y es accesible
                s3_client.head_bucket(Bucket=bucket_name)

                # Intentar obtener fecha aproximada
                try:
                    s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=1)
                    creation_date = datetime.now().isoformat()
                except:
                    creation_date = datetime.now().isoformat()

                bucket_info = BucketInfo(name=bucket_name, creation_date=creation_date)
                buckets.append(bucket_info)

            except Exception as bucket_error:
                logger.warning(f"Bucket {bucket_name} no accesible: {bucket_error}")
                # Incluir el bucket aunque no sea accesible
                bucket_info = BucketInfo(
                    name=bucket_name, creation_date=datetime.now().isoformat()
                )
                buckets.append(bucket_info)

        return buckets

    except Exception as e:
        logger.error(f"Error al procesar buckets: {e}")
        # Fallback: devolver la lista del .env sin verificar accesibilidad
        return [
            BucketInfo(name=bucket_name, creation_date=datetime.now().isoformat())
            for bucket_name in predefined_buckets
        ]


@app.get("/api/buckets/{bucket}/objects", response_model=List[S3Object])
async def list_objects(
    bucket: str,
    prefix: Optional[str] = Query(
        "", description="Prefijo para navegación por carpetas"
    ),
    delimiter: str = Query("/", description="Delimitador para carpetas"),
    max_keys: int = Query(100, description="Máximo número de resultados"),
    s3_client=Depends(get_s3_client),
):
    """Listar objetos y carpetas en un bucket específico con navegación jerárquica"""
    try:
        params = {
            "Bucket": bucket,
            "Delimiter": delimiter,
            "MaxKeys": max_keys,
        }

        if prefix:
            params["Prefix"] = prefix

        objects = []
        folders = set()

        # Listar objetos con delimitador para obtener carpetas
        response = s3_client.list_objects_v2(**params)

        # Procesar carpetas (CommonPrefixes)
        if "CommonPrefixes" in response:
            for folder in response["CommonPrefixes"]:
                folder_key = folder["Prefix"]
                folder_name = folder_key.replace(prefix, "").rstrip("/")

                s3_obj = S3Object(
                    key=folder_key,
                    name=folder_name,
                    last_modified=datetime.now().isoformat(),
                    size=0,
                    size_mb=0,
                    type="folder",
                    is_folder=True,
                )
                objects.append(s3_obj)
                folders.add(folder_key)

        # Procesar archivos (Contents)
        if "Contents" in response:
            for obj in response["Contents"]:
                key = obj["Key"]

                # Saltar si es una carpeta (termina con /) o ya la procesamos
                if key.endswith("/") or key in folders:
                    continue

                # Filtrar archivos soportados
                supported_extensions = (".parquet", ".csv", ".json", ".txt")
                if key.lower().endswith(supported_extensions):
                    file_name = key.split("/")[-1]

                    s3_obj = S3Object(
                        key=key,
                        name=file_name,
                        last_modified=obj["LastModified"].isoformat(),
                        size=obj["Size"],
                        size_mb=round(obj["Size"] / (1024 * 1024), 2),
                        type="file",
                        is_folder=False,
                        etag=obj.get("ETag", ""),
                    )
                    objects.append(s3_obj)

        # Ordenar: carpetas primero, luego archivos
        objects.sort(key=lambda x: (not x.is_folder, x.name.lower()))

        return objects

    except Exception as e:
        logger.error(f"Error al listar objetos en bucket {bucket}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/buckets/{bucket}/explore")
async def explore_bucket(
    bucket: str,
    path: Optional[str] = Query("", description="Ruta dentro del bucket"),
    s3_client=Depends(get_s3_client),
):
    """Explorar bucket con navegación jerárquica - devuelve carpetas y archivos"""
    try:
        params = {
            "Bucket": bucket,
            "Delimiter": "/",
            "MaxKeys": 100,
        }

        # Normalizar la ruta
        normalized_path = path.strip("/") if path else ""
        if normalized_path:
            params["Prefix"] = normalized_path + "/"

        response = s3_client.list_objects_v2(**params)

        result = {
            "bucket": bucket,
            "current_path": normalized_path or "/",
            "folders": [],
            "files": [],
            "parent_path": None,
        }

        # Calcular ruta padre si no estamos en la raíz
        if normalized_path:
            path_parts = normalized_path.split("/")
            if len(path_parts) > 1:
                result["parent_path"] = "/".join(path_parts[:-1])
            else:
                result["parent_path"] = ""

        # Procesar carpetas
        if "CommonPrefixes" in response:
            for folder in response["CommonPrefixes"]:
                folder_key = folder["Prefix"]
                # Extraer solo el nombre de la carpeta (última parte)
                folder_parts = folder_key.rstrip("/").split("/")
                folder_name = folder_parts[-1] if folder_parts else folder_key

                result["folders"].append(
                    {
                        "name": folder_name,
                        "path": folder_key.rstrip("/"),
                        "type": "folder",
                    }
                )

        # Procesar archivos Parquet
        if "Contents" in response:
            for obj in response["Contents"]:
                key = obj["Key"]

                # Saltar si es una carpeta (termina con /)
                if key.endswith("/"):
                    continue

                # Filtrar archivos soportados
                supported_extensions = (".parquet", ".csv", ".json", ".txt")
                if key.lower().endswith(supported_extensions):
                    file_name = key.split("/")[-1]

                    result["files"].append(
                        {
                            "name": file_name,
                            "key": key,
                            "size": obj["Size"],
                            "size_mb": round(obj["Size"] / (1024 * 1024), 2),
                            "last_modified": obj["LastModified"].isoformat(),
                            "type": "file",
                        }
                    )

        # Si no hay carpetas ni archivos, verificar si estamos en una hoja (archivo directo)
        if not result["folders"] and not result["files"] and normalized_path:
            # Intentar ver si la ruta es un archivo soportado
            supported_extensions = (".parquet", ".csv", ".json", ".txt")
            if normalized_path.lower().endswith(supported_extensions):
                try:
                    # Verificar si el archivo existe
                    head_response = s3_client.head_object(
                        Bucket=bucket, Key=normalized_path
                    )
                    result["files"].append(
                        {
                            "name": normalized_path.split("/")[-1],
                            "key": normalized_path,
                            "size": head_response["ContentLength"],
                            "size_mb": round(
                                head_response["ContentLength"] / (1024 * 1024), 2
                            ),
                            "last_modified": head_response["LastModified"].isoformat(),
                            "type": "file",
                        }
                    )
                except Exception:
                    # El archivo no existe o no es accesible
                    pass

        # Ordenar resultados
        result["folders"].sort(key=lambda x: x["name"].lower())
        result["files"].sort(key=lambda x: x["name"].lower())

        return result

    except Exception as e:
        logger.error(f"Error al explorar bucket {bucket}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/file/metadata")
async def get_file_metadata(bucket: str, key: str, s3_client=Depends(get_s3_client)):
    """Obtener metadata de un archivo (Parquet, CSV, JSON, TXT)"""
    try:
        logger.info(f"Obteniendo metadata de {bucket}/{key}")

        # Obtener información básica del objeto S3
        response = s3_client.head_object(Bucket=bucket, Key=key)
        file_size = response["ContentLength"]
        last_modified = response["LastModified"].isoformat()

        # Determinar el tipo de contenido basado en la extensión
        file_ext = os.path.splitext(key)[1].lower()
        
        columns = []
        row_count = 0
        schema_fields = []

        # Descargar una parte o todo el archivo para inferir metadata si es necesario
        # Para archivos grandes como Parquet o CSV, leemos solo lo necesario o usamos pandas
        
        if file_ext == ".parquet":
            # OPTIMIZACIÓN: Usar S3File para leer solo metadatos (footer) sin descargar todo el archivo
            s3_file = S3File(s3_client, bucket, key)
            parquet_file = pq.ParquetFile(s3_file)
            
            columns = parquet_file.schema.names
            row_count = parquet_file.metadata.num_rows
            
            # Usar el esquema de Arrow para obtener tipos de datos más legibles
            schema_arrow = parquet_file.schema_arrow
            schema_fields = []
            for i in range(len(schema_arrow)):
                field = schema_arrow[i]
                schema_fields.append({
                    "name": field.name, 
                    "type": str(field.type), 
                    "nullable": getattr(field, 'nullable', True)
                })
        elif file_ext in (".csv", ".txt"):
            # OPTIMIZACIÓN: Leer solo el primer MB para inferir columnas y tipos
            # Para el conteo de filas, si el archivo es grande (>10MB), devolvemos un estimado o 0 
            # para evitar la descarga completa en el endpoint de metadata
            
            if file_size > 10 * 1024 * 1024:  # 10MB
                logger.info(f"Archivo CSV grande ({file_size} bytes), omitiendo conteo total de filas en metadata")
                # Leer solo el inicio para las columnas
                resp = s3_client.get_object(Bucket=bucket, Key=key, Range="bytes=0-1048575")
                df_sample = pd.read_csv(io.BytesIO(resp["Body"].read()), nrows=100, sep=None, engine='python')
                columns = list(df_sample.columns)
                row_count = -1  # Indica que es un estimado o desconocido
                schema_fields = [
                    {"name": col, "type": str(df_sample[col].dtype), "nullable": True}
                    for col in df_sample.columns
                ]
            else:
                get_obj_resp = s3_client.get_object(Bucket=bucket, Key=key)
                file_content = get_obj_resp["Body"].read()
                try:
                    df = pd.read_csv(io.BytesIO(file_content), sep=None, engine='python')
                    columns = list(df.columns)
                    row_count = len(df)
                    schema_fields = [
                        {"name": col, "type": str(df[col].dtype), "nullable": True}
                        for col in df.columns
                    ]
                except Exception as csv_err:
                    logger.warning(f"No se pudo leer como CSV tabular: {csv_err}")
                    columns = ["contenido"]
                    row_count = 1
                    schema_fields = [{"name": "text", "type": "string", "nullable": True}]
        elif file_ext == ".json":
            get_obj_resp = s3_client.get_object(Bucket=bucket, Key=key)
            file_content = get_obj_resp["Body"].read()
            data = json.loads(file_content)
            if isinstance(data, list) and len(data) > 0:
                if isinstance(data[0], dict):
                    columns = list(data[0].keys())
                    row_count = len(data)
                    schema_fields = [
                        {"name": col, "type": type(data[0][col]).__name__, "nullable": True}
                        for col in columns
                    ]
                else:
                    columns = ["value"]
                    row_count = len(data)
            elif isinstance(data, dict):
                columns = list(data.keys())
                row_count = 1

        metadata = ParquetMetadata(
            columns=columns,
            num_columns=len(columns),
            row_count=row_count,
            num_rows=row_count if row_count != -1 else None,
            file_size=file_size,
            schema={"fields": schema_fields},
            created_at=last_modified,
            format_version="Parquet" if file_ext == ".parquet" else file_ext.lstrip('.').upper()
        )

        return metadata

    except Exception as e:
        logger.error(f"Error al leer metadata de {bucket}/{key}: {e}")
        logger.error(f"Traceback completo: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error al leer metadata: {str(e)}")


# Función eliminada - ahora se usa directamente pandas en get_parquet_metadata


@app.post("/api/file/data")
async def get_file_data(
    request: ParquetDataRequest, s3_client=Depends(get_s3_client)
):
    """Obtener datos de un archivo (Parquet, CSV, JSON, TXT) con opciones de filtrado"""
    try:
        logger.info(f"Obteniendo datos de {request.bucket}/{request.key}")
        
        df = None
        is_tabular = True
        file_ext = os.path.splitext(request.key)[1].lower()
        
        if file_ext == ".parquet":
            # OPTIMIZACIÓN: Leer solo las columnas necesarias
            s3_file = S3File(s3_client, request.bucket, request.key)
            parquet_file = pq.ParquetFile(s3_file)
            
            # Leemos las columnas solicitadas (o todas si no hay filtro de columnas)
            # Al usar S3File, pyarrow solo descargará los datos de esas columnas
            table = parquet_file.read(columns=request.columns)
            
            # Limitamos el número de filas después de leer la tabla (es eficiente en memoria)
            if table.num_rows > request.limit:
                table = table.slice(0, request.limit)
                
            df = table.to_pandas()
                
        elif file_ext in (".csv", ".txt"):
            try:
                # OPTIMIZACIÓN: Para CSV, leer solo los primeros 5MB para la vista previa
                # Esto permite que el sniffer (sep=None) funcione correctamente con un buffer seekable
                response = s3_client.get_object(Bucket=request.bucket, Key=request.key, Range="bytes=0-5242879")
                file_content = response["Body"].read()
                
                # Usar el buffer para leer
                df = pd.read_csv(io.BytesIO(file_content), sep=None, engine='python', nrows=request.limit + 100)
            except Exception as e:
                logger.warning(f"Error leyendo CSV en modo tabular: {e}")
                # Si falla, leer como texto plano (aquí sí descargamos lo necesario)
                response = s3_client.get_object(Bucket=request.bucket, Key=request.key)
                text_content = response["Body"].read().decode('utf-8', errors='replace')
                is_tabular = False
                df = pd.DataFrame([{"line": line} for line in text_content.splitlines()])
        elif file_ext == ".json":
            try:
                response = s3_client.get_object(Bucket=request.bucket, Key=request.key)
                file_content = response["Body"].read()
                data = json.loads(file_content)
                if isinstance(data, list):
                    df = pd.DataFrame(data)
                else:
                    df = pd.DataFrame([data])
            except Exception as json_err:
                logger.error(f"Error parseando JSON: {json_err}")
                raise HTTPException(status_code=400, detail="Error al parsear el archivo JSON")

        if df is None:
            raise HTTPException(status_code=400, detail="Formato de archivo no soportado o no válido")

        # Aplicar filtros si existen (solo si es tabular)
        if request.filters:
            for column, value in request.filters.items():
                if column in df.columns:
                    if isinstance(value, str) and value.strip():
                        df = df[df[column].astype(str).str.contains(value, case=False, na=False)]
                    else:
                        df = df[df[column] == value]

        # Seleccionar columnas
        if request.columns:
            available_cols = [col for col in request.columns if col in df.columns]
            df = df[available_cols]

        # Limitar filas
        df = df.head(request.limit)

        # Preparar resultado
        result = {
            "data": json.loads(df.to_json(orient="records", date_format="iso")),
            "columns": list(df.columns),
            "row_count": len(df),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "file_type": file_ext.lstrip('.'),
            "is_tabular": is_tabular
        }

        return result
    except Exception as e:
        logger.error(f"Error al leer datos de {request.bucket}/{request.key}: {e}")
        logger.error(f"Traceback completo: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error al leer datos: {str(e)}")


@app.get("/api/download")
async def download_parquet(
    bucket: str,
    key: str,
    format: str = Query("csv", regex="^(csv|json|parquet)$"),
    s3_client=Depends(get_s3_client),
):
    """Descargar archivo Parquet en diferentes formatos"""
    try:
        # Descargar archivo Parquet
        response = s3_client.get_object(Bucket=bucket, Key=key)
        file_content = response["Body"].read()

        # Leer Parquet
        df = pd.read_parquet(io.BytesIO(file_content))

        # Convertir al formato solicitado
        if format == "csv":
            output = df.to_csv(index=False)
            media_type = "text/csv"
            filename = key.replace(".parquet", ".csv")
        elif format == "json":
            output = df.to_json(orient="records", date_format="iso")
            media_type = "application/json"
            filename = key.replace(".parquet", ".json")
        else:  # parquet
            if PYARROW_AVAILABLE:
                output = file_content
            else:
                # Si pyarrow no está disponible, convertir a CSV por defecto
                output = df.to_csv(index=False)
                media_type = "text/csv"
                filename = key.replace(".parquet", ".csv")
                logger.warning(
                    f"pyarrow no disponible, descargando {key} como CSV en lugar de Parquet"
                )

            if "media_type" not in locals():
                media_type = "application/octet-stream"
                filename = key

        # Crear respuesta de streaming
        return StreamingResponse(
            io.StringIO(output) if isinstance(output, str) else io.BytesIO(output),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        logger.error(f"Error al descargar {bucket}/{key}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/search")
async def search_parquet_files(
    bucket: str,
    query: str = Query(..., description="Texto a buscar en nombres de archivos"),
    s3_client=Depends(get_s3_client),
):
    """Buscar archivos Parquet por nombre"""
    try:
        objects = []
        paginator = s3_client.get_paginator("list_objects_v2")

        for page in paginator.paginate(Bucket=bucket):
            if "Contents" in page:
                for obj in page["Contents"]:
                    if (
                        obj["Key"].endswith(".parquet")
                        and query.lower() in obj["Key"].lower()
                    ):
                        s3_obj = S3Object(
                            key=obj["Key"],
                            name=obj["Key"].split("/")[-1],
                            last_modified=obj["LastModified"].isoformat(),
                            size=obj["Size"],
                            size_mb=round(obj["Size"] / (1024 * 1024), 2),
                            etag=obj.get("ETag", ""),
                        )
                        objects.append(s3_obj)

        return {"query": query, "results": objects, "count": len(objects)}
    except Exception as e:
        logger.error(f"Error en búsqueda en bucket {bucket}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/buckets/copy")
async def copy_s3_object(request: CopyObjectRequest, s3_client=Depends(get_s3_client)):
    """Copiar un objeto de un bucket a otro"""
    try:
        logger.info(
            f"Copiando objeto: {request.source_bucket}/{request.source_key} -> {request.dest_bucket}/{request.dest_key}"
        )

        copy_source = {"Bucket": request.source_bucket, "Key": request.source_key}

        # Ejecutar la copia
        s3_client.copy_object(
            CopySource=copy_source, Bucket=request.dest_bucket, Key=request.dest_key
        )

        logger.info("Copia completada exitosamente")
        return {
            "status": "success",
            "message": f"Archivo copiado exitosamente a {request.dest_bucket}/{request.dest_key}",
        }
    except Exception as e:
        logger.error(f"Error al copiar objeto: {e}")
        raise HTTPException(status_code=500, detail=f"Error al copiar archivo: {str(e)}")


@app.post("/api/buckets/bulk-copy")
async def bulk_copy_s3_objects(
    request: BulkCopyRequest, s3_client=Depends(get_s3_client)
):
    """Copiar múltiples objetos de un bucket a otro"""
    try:
        logger.info(
            f"Copiando {len(request.source_keys)} objetos: {request.source_bucket} -> {request.dest_bucket}/{request.dest_path}"
        )

        results = []
        errors = []

        for key in request.source_keys:
            try:
                file_name = key.split("/")[-1]
                dest_key = (
                    f"{request.dest_path.rstrip('/')}/{file_name}"
                    if request.dest_path
                    else file_name
                )

                copy_source = {"Bucket": request.source_bucket, "Key": key}

                s3_client.copy_object(
                    CopySource=copy_source, Bucket=request.dest_bucket, Key=dest_key
                )
                results.append(key)
            except Exception as e:
                logger.error(f"Error al copiar {key}: {e}")
                errors.append({"key": key, "error": str(e)})

        return {
            "status": "success" if not errors else "partial_success",
            "message": f"Copia completada: {len(results)} exitosos, {len(errors)} errores",
            "copied_count": len(results),
            "errors": errors,
        }
    except Exception as e:
        logger.error(f"Error en proceso de copia masiva: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error en copia masiva: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Endpoint de verificación de salud"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    import uvicorn

    # Mostrar información de dependencias al iniciar
    print("=" * 60)
    print("S3 PARQUET EXPLORER - BACKEND")
    print("=" * 60)
    print(f"Python: {os.sys.version}")
    print(f"Pandas: {pd.__version__}")
    print(f"PyArrow disponible: {PYARROW_AVAILABLE}")

    if not PYARROW_AVAILABLE:
        print("\n⚠️  ADVERTENCIA: pyarrow no está instalado")
        print("   Algunas funciones de Parquet estarán limitadas")
        print("   Para funcionalidad completa, instala pyarrow:")
        print("   pip install pyarrow")
        print("   o instala Visual Studio Build Tools para compilar")

    print("\n" + "=" * 60)
    print("Iniciando servidor...")
    print("API: http://localhost:8000")
    print("Docs: http://localhost:8000/docs")
    print("=" * 60 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
