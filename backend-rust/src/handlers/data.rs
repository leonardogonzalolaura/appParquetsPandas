// src/handlers/data.rs
use actix_web::{post, web, HttpResponse, Responder};
use crate::models::ParquetDataRequest;
use crate::s3_client::S3Client;
use crate::parquet_parser::read_parquet_data;
use log::{info, error};

#[post("/api/file/data")]
pub async fn get_file_data(
    request: web::Json<ParquetDataRequest>,
    s3_client: web::Data<S3Client>,
) -> impl Responder {
    // 📝 Log 1: Request recibido
    info!("=== INICIO get_file_data ===");
    info!("Request bucket: {}", request.bucket);
    info!("Request key: {}", request.key);
    info!("Request limit: {:?}", request.limit);
    
    let bucket = &request.bucket;
    let key = &request.key;
    let limit = request.limit.unwrap_or(100);
    let columns = request.columns.as_ref();
    let filters = request.filters.as_ref();
    
    // 📝 Log 2: Antes de llamar a S3
    info!("Llamando a read_parquet_data con bucket={}, key={}, limit={}", bucket, key, limit);
    
    match read_parquet_data(&s3_client, bucket, key, limit, columns, filters).await {
        Ok((data, columns, dtypes)) => {
            let row_count = data.len();
            info!("✅ Éxito! Filas leídas: {}", row_count);
            
            let response = crate::models::TableDataResponse {
                data,
                columns,
                row_count,
                dtypes,
                file_type: "parquet".to_string(),
                is_tabular: true,
            };
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            // 📝 Log 3: Error detallado
            error!("❌ Error en read_parquet_data: {}", e);
            error!("Bucket: {}", bucket);
            error!("Key: {}", key);
            HttpResponse::InternalServerError().body(format!("Error: {}", e))
        }
    }
}