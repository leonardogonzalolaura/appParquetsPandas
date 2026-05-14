use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;  // ← CAMBIADO: usar tokio::sync::Mutex
use crate::sql_engine::SqlEngine;

#[derive(Debug, Deserialize)]
pub struct SqlQueryRequest {
    pub sql: String,
}

#[derive(Debug, Serialize)]
pub struct SqlQueryResponse {
    pub success: bool,
    pub data: Option<Vec<serde_json::Value>>,
    pub error: Option<String>,
    pub row_count: usize,
}

#[derive(Debug, Deserialize)]
pub struct RegisterTableRequest {
    pub table_name: String,
    pub bucket: String,
    pub prefix: String,
}

#[derive(Debug, Serialize)]
pub struct RegisterTableResponse {
    pub success: bool,
    pub message: String,
    pub row_count: Option<usize>,
    pub error: Option<String>,
}

pub async fn execute_sql(
    engine: web::Data<Arc<Mutex<SqlEngine>>>,
    req: web::Json<SqlQueryRequest>,
) -> impl Responder {
    // Validación de seguridad
    let sql_upper = req.sql.to_uppercase();
    let dangerous = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "CREATE", "TRUNCATE"];
    if dangerous.iter().any(|&word| sql_upper.contains(word)) {
        return HttpResponse::BadRequest().json(SqlQueryResponse {
            success: false,
            data: None,
            error: Some("Solo consultas SELECT están permitidas".to_string()),
            row_count: 0,
        });
    }
    
    // ← CAMBIADO: usar .await en lugar de .lock() directo
    let engine = engine.lock().await;
    
    match engine.execute_query(&req.sql).await {
        Ok(data) => {
            let row_count = data.len();
            HttpResponse::Ok().json(SqlQueryResponse {
                success: true,
                data: Some(data),
                error: None,
                row_count,
            })
        }
        Err(e) => {
            eprintln!("SQL Error: {}", e);
            HttpResponse::BadRequest().json(SqlQueryResponse {
                success: false,
                data: None,
                error: Some(format!("Error en consulta: {}", e)),
                row_count: 0,
            })
        }
    }
}

pub async fn register_table(
    engine: web::Data<Arc<Mutex<SqlEngine>>>,
    req: web::Json<RegisterTableRequest>,
) -> impl Responder {
    // ← CAMBIADO: usar .await
    let mut engine = engine.lock().await;
    
    match engine.register_table(&req.table_name, &req.bucket, &req.prefix).await {
        Ok(row_count) => HttpResponse::Ok().json(RegisterTableResponse {
            success: true,
            message: format!("Tabla '{}' registrada correctamente", req.table_name),
            row_count: Some(row_count),
            error: None,
        }),
        Err(e) => HttpResponse::BadRequest().json(RegisterTableResponse {
            success: false,
            message: format!("Error registrando tabla: {}", e),
            row_count: None,
            error: Some(e.to_string()),
        })
    }
}

pub async fn list_registered_tables(
    engine: web::Data<Arc<Mutex<SqlEngine>>>,
) -> impl Responder {
    // ← CAMBIADO: usar .await
    let engine = engine.lock().await;
    
    let tables = engine.list_tables();
    HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "tables": tables
    }))
}