use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::sql_engine::SqlEngine;

#[derive(Debug, Deserialize)]
pub struct SqlQueryRequest {
    pub sql: String,
    pub limit: Option<usize>,
}

#[derive(Debug, Serialize)]
pub struct SqlQueryResponse {
    pub success: bool,
    pub data: Option<Vec<serde_json::Value>>,
    pub error: Option<String>,
    pub row_count: usize,
    pub execution_time_ms: u128,
}

#[derive(Debug, Deserialize)]
pub struct RegisterTableRequest {
    pub table_name: String,
    pub s3_path: String,  // Puede ser "s3://bucket/prefix/" o "prefix/"
}

pub async fn execute_sql(
    engine: web::Data<Arc<SqlEngine>>,
    req: web::Json<SqlQueryRequest>,
) -> impl Responder {
    let start = std::time::Instant::now();
    
    // Validación de seguridad
    let sql_upper = req.sql.to_uppercase();
    let dangerous = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "CREATE", "TRUNCATE"];
    if dangerous.iter().any(|&word| sql_upper.contains(word)) {
        return HttpResponse::BadRequest().json(SqlQueryResponse {
            success: false,
            data: None,
            error: Some("Solo consultas SELECT están permitidas".to_string()),
            row_count: 0,
            execution_time_ms: start.elapsed().as_millis(),
        });
    }
    
    // Agregar LIMIT si se especifica y no existe en la consulta original
    let sql = if let Some(limit) = req.limit {
        if !sql_upper.contains("LIMIT") {
            format!("{} LIMIT {}", req.sql, limit)
        } else {
            req.sql.clone()
        }
    } else {
        req.sql.clone()
    };
    
    println!("📊 Ejecutando SQL: {}", sql);
    
    match engine.execute_query(&sql).await {
        Ok(data) => {
            let row_count = data.len();
            let execution_time = start.elapsed().as_millis();
            println!("✅ Query completada: {} filas en {} ms", row_count, execution_time);
            
            HttpResponse::Ok().json(SqlQueryResponse {
                success: true,
                data: Some(data),
                error: None,
                row_count,
                execution_time_ms: execution_time,
            })
        }
        Err(e) => {
            eprintln!("❌ SQL Error: {}", e);
            HttpResponse::InternalServerError().json(SqlQueryResponse {
                success: false,
                data: None,
                error: Some(format!("Error de consulta: {}", e)),
                row_count: 0,
                execution_time_ms: start.elapsed().as_millis(),
            })
        }
    }
}

pub async fn register_table(
    engine: web::Data<Arc<SqlEngine>>,
    req: web::Json<RegisterTableRequest>,
) -> impl Responder {
    println!("📝 Registrando tabla '{}' desde: {}", req.table_name, req.s3_path);
    
    match engine.register_parquet_table(&req.table_name, &req.s3_path).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": format!("Tabla '{}' registrada correctamente", req.table_name),
            "tables": engine.list_tables()
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "success": false,
            "error": format!("Error registrando tabla: {}", e)
        }))
    }
}

pub async fn list_registered_tables(
    engine: web::Data<Arc<SqlEngine>>,
) -> impl Responder {
    let tables = engine.list_tables();
    HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "tables": tables
    }))
}