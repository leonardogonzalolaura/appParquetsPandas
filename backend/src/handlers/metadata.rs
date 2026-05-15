use actix_web::{get, web, HttpResponse, Responder, HttpRequest};
use serde::Deserialize;
use crate::models::FileMetadata;
use crate::s3_client::S3Client;
use crate::parquet_parser::get_parquet_metadata;
use crate::handlers::get_s3_client;
use crate::config::Config;
use log::info;

#[derive(Debug, Deserialize)]
pub struct MetadataQuery {
    bucket: String,
    key: String,
}

#[get("/api/file/metadata")]
pub async fn get_file_metadata(
    req: HttpRequest,
    query: web::Query<MetadataQuery>,
    default_s3: web::Data<S3Client>,
    config: web::Data<Config>,
) -> impl Responder {
    let s3_client = get_s3_client(&req, &default_s3, &config).await;

    let bucket = &query.bucket;
    let key = &query.key;
    
    info!("=== METADATA REQUEST ===");
    info!("Bucket: {}", bucket);
    info!("Key: {}", key);
    
    // Obtener metadata básica de S3
    let head = match s3_client
        .head_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await
    {
        Ok(resp) => resp,
        Err(e) => {
            info!("❌ Error: {}", e);
            return HttpResponse::NotFound().body(format!("Error: {}", e));
        }
    };
    
    let file_size = head.content_length().unwrap_or(0) as i64;
    let last_modified = head.last_modified()
        .map(|t| t.to_string())
        .unwrap_or_else(|| "unknown".to_string());
    
    // Obtener metadata REAL del Parquet
    match get_parquet_metadata(&s3_client, bucket, key).await {
        Ok((columns, row_count, schema_fields)) => {
            info!("✅ Éxito: {} columnas, {} filas", columns.len(), row_count);
            
            let metadata = FileMetadata {
                columns: columns.clone(),
                num_columns: columns.len(),
                row_count: row_count as i64,
                num_rows: Some(row_count as i64),
                file_size,
                schema: crate::models::SchemaInfo { fields: schema_fields },
                created_at: Some(last_modified),
                format_version: "Parquet".to_string(),
            };
            
            HttpResponse::Ok().json(metadata)
        }
        Err(e) => {
            info!("❌ Error: {}", e);
            HttpResponse::InternalServerError().body(format!("Error: {}", e))
        }
    }
}