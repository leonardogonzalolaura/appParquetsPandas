# S3 Parquet Explorer API - Rust

API de alto rendimiento para explorar y analizar archivos Parquet, CSV, JSON y TXT almacenados en Amazon S3. Construida con Rust y Actix-web, ofrece una alternativa significativamente más rápida y eficiente en memoria que la versión en Python.

## 🚀 Características

- **Alto rendimiento**: Hasta 20-30x más rápido que la versión Python
- **Bajo consumo de memoria**: ~10-15 MB vs ~80-120 MB en Python
- **Lectura eficiente de Parquet**: Utiliza solicitudes de rango (Range Requests) para leer solo los metadatos necesarios
- **Múltiples formatos**: Soporta Parquet, CSV, JSON y TXT
- **Exploración jerárquica**: Navegación por carpetas en S3
- **Copia de archivos**: Copia individual o masiva entre buckets
- **Búsqueda**: Búsqueda de archivos por nombre
- **CORS habilitado**: Listo para integrar con frontend React

## 📋 Requisitos previos

- **Rust** (versión 1.70 o superior)
- **Cargo** (viene con Rust)
- **AWS Credentials** configuradas (ver sección de configuración)

### Instalar Rust

```bash
# Linux / macOS
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Windows
# Descargar desde https://rustup.rs/