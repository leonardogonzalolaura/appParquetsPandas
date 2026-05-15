mod config;
mod models;
mod s3_client;
mod s3_file;
mod handlers;
mod parquet_parser;
mod sql_engine;

use actix_cors::Cors;
use actix_web::{web, App, HttpServer, HttpResponse};
use config::Config;
use s3_client::create_s3_client;
use serde_json::json;
use sql_engine::SqlEngine;
use std::sync::Arc;
use tokio::sync::Mutex;  // ← CAMBIADO: usar tokio::sync::Mutex

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    let config = Config::from_env();
    let s3_client = create_s3_client(&config.aws_region).await;
    
    // Inicializar SQL Engine con DataFusion - Usando tokio::sync::Mutex
    let sql_engine = Arc::new(Mutex::new(
        SqlEngine::new(&config.aws_region)
            .await
            .expect("Failed to initialize SQL engine")
    ));
    
    // Registrar tablas por defecto para los buckets predefinidos
    let engine_clone = sql_engine.clone();
    let buckets_predefinidos = config.predefined_buckets.clone();
    
    tokio::spawn(async move {
        println!("\n📦 Registrando buckets predefinidos...");
        let mut engine = engine_clone.lock().await;  // ← CAMBIADO: .await en lugar de .unwrap()
        for bucket in &buckets_predefinidos {
            let table_name = bucket.replace("-", "_").replace(".", "_");
            
            match engine.register_table(&table_name, bucket, "").await {
                Ok(row_count) => println!("   ✅ Tabla '{}' registrada: {} filas (bucket: {})", table_name, row_count, bucket),
                Err(e) => println!("   ⚠️  Bucket '{}': {} (puede que no tenga archivos Parquet)", bucket, e),
            }
        }
        println!();
    });
    
    println!("{}", "=".repeat(60));
    println!("S3 PARQUET EXPLORER - RUST BACKEND");
    println!("{}", "=".repeat(60));
    println!("AWS Region: {}", config.aws_region);
    println!("Predefined buckets: {:?}", config.predefined_buckets);
    println!("\n📊 SQL Endpoints (usando DataFusion):");
    println!("   POST   /api/sql/query      - Ejecutar consulta SQL");
    println!("   POST   /api/sql/register   - Registrar tabla Parquet desde S3");
    println!("   GET    /api/sql/tables     - Listar tablas registradas");
    println!("\n🚀 Servidor iniciando en http://localhost:8080");
    println!("{}", "=".repeat(60));
    
    HttpServer::new(move || {
        let cors = Cors::permissive();
        
        App::new()
            .wrap(cors)
            .app_data(web::Data::new(config.clone()))
            .app_data(web::Data::new(s3_client.clone()))
            .app_data(web::Data::new(sql_engine.clone()))  // ← Esto funciona con Arc<Mutex<>>
            // Endpoints generales
            .route("/", web::get().to(|| async { 
                HttpResponse::Ok().json(serde_json::json!({
                    "message": "S3 Parquet Explorer API",
                    "version": "1.0.0",
                    "sql_enabled": true,
                    "sql_engine": "DataFusion"
                }))
            }))
            .route("/health", web::get().to(|| async { 
                HttpResponse::Ok().json(json!({
                    "status": "healthy",
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }))
            }))
            // Endpoints existentes
            .service(handlers::buckets::list_buckets)
            .service(handlers::objects::list_objects)
            .service(handlers::explore::explore_bucket)
            .service(handlers::metadata::get_file_metadata)
            .service(handlers::data::get_file_data)
            .service(handlers::download::download_parquet)
            .service(handlers::search::search_parquet_files)
            .service(handlers::copy::copy_s3_object)
            .service(handlers::copy::bulk_copy_s3_objects)
            // NUEVOS endpoints SQL
            .route("/api/sql/query", web::post().to(handlers::sql::execute_sql))
            .route("/api/sql/register", web::post().to(handlers::sql::register_table))
            .route("/api/sql/tables", web::get().to(handlers::sql::list_registered_tables))
    })
    .bind(("0.0.0.0", 8000))?
    .run()
    .await
}