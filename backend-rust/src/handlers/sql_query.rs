use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::sql_engine::SqlEngine;

#[derive(Debug, Deserialize)]
pub struct SqlQueryRequest {
    pub sql: String,
    pub table_name: Option<String>, 
    pub limit: Option<usize>,
}

#[derive(Debug, Serialize)]
pub struct SqlQueryResponse {
    pub success: bool,
    pub data: Option<Vec<serde_json::Value>>,
    pub error: Option<String>,
    pub row_count: usize,
    pub execution_time_ms: Option<u128>,
}

pub async fn execute_sql_query(
    engine: web::Data<Arc<SqlEngine>>,
    req: web::Json<SqlQueryRequest>,
) -> impl Responder {
    let start = std::time::Instant::now();
    
    // Validación de seguridad
    let sql_upper = req.sql.to_uppercase();
    let dangerous = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "CREATE"];
    if dangerous.iter().any(|&word| sql_upper.contains(word)) {
        return HttpResponse::BadRequest().json(SqlQueryResponse {
            success: false,
            data: None,
            error: Some("Solo consultas SELECT están permitidas".to_string()),
            row_count: 0,
            execution_time_ms: Some(start.elapsed().as_millis()),
        });
    }
    
    // Limitar resultados si es necesario
    let sql = if let Some(limit) = req.limit {
        format!("{} LIMIT {}", req.sql, limit)
    } else {
        req.sql.clone()
    };
    
    match engine.execute_query(&sql).await {
        Ok(data) => {
            let row_count = data.len();
            HttpResponse::Ok().json(SqlQueryResponse {
                success: true,
                data: Some(data),
                error: None,
                row_count,
                execution_time_ms: Some(start.elapsed().as_millis()),
            })
        }
        Err(e) => {
            eprintln!("SQL Error: {}", e);
            HttpResponse::InternalServerError().json(SqlQueryResponse {
                success: false,
                data: None,
                error: Some(format!("Error de consulta: {}", e)),
                row_count: 0,
                execution_time_ms: Some(start.elapsed().as_millis()),
            })
        }
    }
}

// Endpoint adicional para registrar tablas dinámicamente
#[derive(Debug, Deserialize)]
pub struct RegisterTableRequest {
    pub table_name: String,
    pub s3_prefix: String,  
}

pub async fn register_table(
    engine: web::Data<Arc<SqlEngine>>,
    req: web::Json<RegisterTableRequest>,
) -> impl Responder {
    match engine.register_parquet_table(&req.table_name, &req.s3_prefix).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": format!("Tabla '{}' registrada correctamente", req.table_name)
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "success": false,
            "error": format!("Error registrando tabla: {}", e)
        }))
    }
}