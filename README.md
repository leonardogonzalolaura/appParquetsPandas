# S3 Parquet Explorer

Una aplicación web moderna para explorar, visualizar y analizar archivos Parquet en Amazon S3.

## Características Principales

### 🚀 Exploración Avanzada de S3
- **Navegación de Buckets**: Explora todos tus buckets S3 con una interfaz intuitiva
- **Vista de Archivos**: Navega por carpetas y archivos con vistas en cuadrícula o lista
- **Búsqueda Inteligente**: Busca archivos Parquet por nombre, contenido o metadatos
- **Filtros Avanzados**: Filtra por tamaño, fecha de modificación y tipo de archivo

### 📊 Visor Parquet Completo
- **Visualización en Tiempo Real**: Previsualiza archivos Parquet sin descargarlos
- **Metadata Detallada**: Información completa del esquema, tipos de datos y estadísticas
- **Tabla Interactiva**: Navega por los datos con paginación y ordenamiento
- **Vista JSON**: Visualiza los datos en formato JSON estructurado

### 📈 Análisis de Datos
- **Estadísticas Avanzadas**: Análisis de distribución, valores únicos y tendencias
- **Visualizaciones**: Gráficos interactivos para análisis exploratorio
- **Insights Automáticos**: Detección automática de patrones y anomalías
- **Reportes Exportables**: Genera reportes en PDF, CSV y JSON

### ⚙️ Configuración Flexible
- **Gestión de Credenciales**: Soporte para variables de entorno y configuración manual
- **Personalización**: Tema claro/oscuro, idioma y preferencias de visualización
- **Seguridad**: Configuración de tiempo de sesión, 2FA y lista blanca de IPs
- **Notificaciones**: Alertas por email para eventos importantes

## Arquitectura del Proyecto

### Backend (Python/FastAPI)
```
appParquetsPandas/backend/
├── main.py              # API principal con FastAPI
├── requirements.txt     # Dependencias de Python
├── run.py              # Script de ejecución
└── .env.example        # Configuración de ejemplo
```

### Frontend (React)
```
appParquetsPandas/frontend/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/         # Páginas principales
│   ├── App.js         # Componente principal
│   └── index.js       # Punto de entrada
├── public/            # Archivos estáticos
├── package.json       # Dependencias de Node.js
└── tailwind.config.js # Configuración de Tailwind CSS
```

## Requisitos Previos

### Para el Backend
- Python 3.8 o superior
- Credenciales AWS configuradas (variables de entorno o archivo .env)
- Permisos de lectura en los buckets S3

### Para el Frontend
- Node.js 16 o superior
- npm o yarn

## Instalación y Configuración

### 1. Configuración del Backend

```bash
# Navegar al directorio del backend
cd appParquetsPandas/backend

# Crear entorno virtual (recomendado)
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Crear y editar el archivo de configuracion
copy .env.example .env        # Windows
# cp .env.example .env        # Linux/Mac
```

> **Importante:** Edita `backend/.env` y configura al menos `S3_PREDEFINED_BUCKETS` con los nombres de tus buckets S3 (ver sección [Configuración de Buckets S3](#configuración-de-buckets-s3)).

### 2. Configuración del Frontend

```bash
# Navegar al directorio del frontend
cd appParquetsPandas/frontend

# Instalar dependencias
npm install
```

## Ejecución

### Opción 1: Scripts `.bat` (Windows — Recomendado)

El proyecto incluye scripts listos para usar en Windows:

| Script | Descripción |
|---|---|
| `start.bat` | Inicia backend y frontend juntos en una sola ventana |
| `backend\start_backend.bat` | Inicia solo el backend (FastAPI en puerto 8000) |
| `frontend\start_frontend.bat` | Inicia solo el frontend (React en puerto 3000) |

```bat
REM Desde el directorio raiz del proyecto:
start.bat

REM O por separado:
backend\start_backend.bat
frontend\start_frontend.bat
```

El script `start.bat` también crea automáticamente el archivo `backend/.env` si no existe (copia desde `.env.example`).

### Opción 2: Línea de comandos

**Backend:**
```bash
cd backend
call venv\Scripts\activate
python run.py
```

**Frontend:**
```bash
cd frontend
npm start
```

## Configuración de Buckets S3

La lista de buckets que aparece en la aplicación se configura mediante la variable `S3_PREDEFINED_BUCKETS` en el archivo `backend/.env`. No hay ningún bucket hardcodeado en el código.

```env
# backend/.env
# Reemplaza con los nombres de TUS propios buckets, separados por coma:
S3_PREDEFINED_BUCKETS=mi-bucket-prod,mi-bucket-staging,mi-bucket-dev
```

Cada vez que quieras agregar, quitar o cambiar un bucket, solamente edita esa línea en `backend/.env` y reinicia el backend.

## Configuración de AWS

La aplicación usa la cadena de credenciales estándar de boto3. Puedes configurarlas de cualquiera de estas formas:

### Método 1: Archivo .env (recomendado para desarrollo local)
```env
# backend/.env
AWS_ACCESS_KEY_ID=tu_access_key_id
AWS_SECRET_ACCESS_KEY=tu_secret_access_key
AWS_REGION=us-east-1
```

### Método 2: Variables de entorno del sistema
```bat
REM Windows (permanente)
setx AWS_ACCESS_KEY_ID "tu_access_key_id"
setx AWS_SECRET_ACCESS_KEY "tu_secret_access_key"
setx AWS_REGION "us-east-1"
```

### Permisos IAM Requeridos
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            "Resource": "*"
        }
    ]
}
```

## Uso de la Aplicación

### 1. Dashboard
- **Resumen General**: Estadísticas de buckets y archivos
- **Buckets Favoritos**: Acceso rápido a buckets frecuentes
- **Archivos Recientes**: Últimos archivos modificados

### 2. Explorador de Buckets
- **Navegación Jerárquica**: Explora carpetas y subcarpetas
- **Vistas Múltiples**: Cuadrícula o lista según preferencia
- **Operaciones Masivas**: Selección múltiple y descarga en lote

### 3. Visor Parquet
- **Metadata Completa**: Esquema, tipos de datos y estadísticas
- **Filtrado Avanzado**: Filtra por columnas y valores específicos
- **Exportación**: Descarga en CSV, JSON o formato Parquet original

### 4. Análisis de Datos
- **Tendencias**: Evolución temporal de archivos y datos
- **Distribuciones**: Análisis por bucket y tipo de archivo
- **Insights**: Recomendaciones automáticas basadas en patrones

### 5. Configuración
- **AWS S3**: Gestión de credenciales y regiones
- **Aplicación**: Personalización de interfaz y comportamiento
- **Seguridad**: Configuración de acceso y auditoría

## API Endpoints

### Buckets
- `GET /api/buckets` - Listar todos los buckets
- `GET /api/buckets/{bucket}/objects` - Listar objetos en un bucket

### Parquet
- `GET /api/parquet/metadata` - Obtener metadata de archivo Parquet
- `POST /api/parquet/data` - Obtener datos con filtros
- `GET /api/download` - Descargar archivo en diferentes formatos

### Utilidades
- `GET /health` - Verificar estado del servicio
- `GET /api/search` - Buscar archivos por nombre

## Desarrollo

### Estructura del Código

**Backend:**
- `main.py`: Contiene todas las rutas de la API
- Modelos Pydantic para validación de datos
- Manejo de errores y logging
- Integración con boto3 para AWS S3

**Frontend:**
- Componentes funcionales con React Hooks
- Estilos con Tailwind CSS
- Estado gestionado con React Context (si se expande)
- Peticiones HTTP con axios

### Extensión del Proyecto

Para agregar nuevas funcionalidades:

1. **Nuevos Endpoints API**: Agregar rutas en `backend/main.py`
2. **Nuevos Componentes**: Crear en `frontend/src/components/`
3. **Nuevas Páginas**: Agregar en `frontend/src/pages/`
4. **Estilos Personalizados**: Modificar `frontend/src/index.css`

## Solución de Problemas

### Problemas Comunes

1. **Error de conexión AWS**
   - Verificar credenciales en variables de entorno
   - Confirmar permisos IAM
   - Verificar región configurada

2. **Archivos Parquet no visibles**
   - Confirmar que los archivos tienen extensión `.parquet`
   - Verificar permisos de lectura en el bucket
   - Comprobar prefijos/carpetas en la ruta

3. **Problemas de rendimiento**
   - Limitar número de filas en vista previa
   - Habilitar caché en configuración
   - Usar filtros para reducir datos

### Logs y Monitoreo

**Backend:**
```bash
# Ver logs en tiempo real
tail -f backend/logs/app.log
```

**Frontend:**
- Herramientas de desarrollo del navegador (F12)
- Console para errores JavaScript
- Network para peticiones HTTP

## Contribución

1. Fork del proyecto
2. Crear rama de características (`git checkout -b feature/AmazingFeature`)
3. Commit de cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## Soporte

Para soporte y preguntas:
- Crear un issue en el repositorio
- Consultar la documentación
- Contactar al equipo de desarrollo

## Roadmap

### Próximas Características
- [ ] Autenticación y autorización
- [ ] Compartición de vistas y dashboards
- [ ] Integración con otros servicios AWS (Glue, Athena)
- [ ] Análisis predictivo y machine learning
- [ ] Plugins y extensiones

### Mejoras Técnicas
- [ ] Tests unitarios y de integración
- [ ] Dockerización completa
- [ ] CI/CD pipeline
- [ ] Monitoreo y métricas

---

**Nota**: Esta aplicación está diseñada para entornos de desarrollo y staging. Para producción, considerar:
- Implementar autenticación robusta
- Configurar HTTPS
- Establecer límites de uso
- Monitorear costos AWS

¡Disfruta explorando tus datos Parquet en S3! 🚀