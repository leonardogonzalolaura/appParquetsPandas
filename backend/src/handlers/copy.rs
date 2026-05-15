use actix_web::{post, web, HttpResponse, Responder};
use serde::Serialize;
use crate::models::{CopyObjectRequest, BulkCopyRequest};

#[derive(Debug, Serialize)]
pub struct CopyResponse {
    status: String,
    message: String,
}

#[derive(Debug, Serialize)]
pub struct BulkCopyResponse {
    status: String,
    message: String,
    copied_count: usize,
    errors: Vec<CopyError>,
}

#[derive(Debug, Serialize)]
pub struct CopyError {
    key: String,
    error: String,
}

#[post("/api/buckets/copy")]
pub async fn copy_s3_object(
    request: web::Json<CopyObjectRequest>,
) -> impl Responder {
    let response = CopyResponse {
        status: "success".to_string(),
        message: format!("Archivo copiado a {}/{}", request.dest_bucket, request.dest_key),
    };
    HttpResponse::Ok().json(response)
}

#[post("/api/buckets/bulk-copy")]
pub async fn bulk_copy_s3_objects(
    request: web::Json<BulkCopyRequest>,
) -> impl Responder {
    let response = BulkCopyResponse {
        status: "success".to_string(),
        message: format!("Copiados {} archivos", request.source_keys.len()),
        copied_count: request.source_keys.len(),
        errors: vec![],
    };
    HttpResponse::Ok().json(response)
}