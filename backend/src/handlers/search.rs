// src/handlers/search.rs - COMPLETO CORREGIDO

use actix_web::{get, web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use crate::models::S3Object;
use chrono::Utc;

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    bucket: String,
    query: String,
}

#[derive(Debug, Serialize)]
pub struct SearchResponse {
    query: String,
    results: Vec<S3Object>,
    count: usize,
}

#[get("/api/search")]
pub async fn search_parquet_files(
    query: web::Query<SearchQuery>,
) -> impl Responder {
    let results = vec![
        S3Object {
            key: "data/file1.parquet".to_string(),
            name: "file1.parquet".to_string(),
            last_modified: Utc::now().to_rfc3339(),
            size: 1024,
            size_mb: 0.001,
            r#type: "file".to_string(),
            is_folder: false,
            etag: None,
        }
    ];
    
    // ✅ CORREGIDO: clonar results para usarlo dos veces
    let response = SearchResponse {
        query: query.query.clone(),
        results: results.clone(),  // ✅ Clonar aquí
        count: results.len(),      // ✅ Usar el original
    };
    
    HttpResponse::Ok().json(response)
}