use actix_web::{post, web, HttpResponse, Responder, HttpRequest};
use crate::models::ParquetDataRequest;
use crate::s3_client::S3Client;
use crate::parquet_parser::read_parquet_data;
use crate::handlers::get_s3_client;
use crate::config::Config;
use log::{info, error};

#[post("/api/file/data")]
pub async fn get_file_data(
    req: HttpRequest,
    request: web::Json<ParquetDataRequest>,
    default_s3: web::Data<S3Client>,
    config: web::Data<Config>,
) -> impl Responder {
    let s3_client = get_s3_client(&req, &default_s3, &config).await;

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