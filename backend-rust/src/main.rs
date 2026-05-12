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

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    let config = Config::from_env();
    let s3_client = create_s3_client(&config.aws_region).await;
    
    println!("{}", "=".repeat(60));
    println!("S3 PARQUET EXPLORER - RUST BACKEND");
    println!("{}", "=".repeat(60));
    println!("AWS Region: {}", config.aws_region);
    println!("Predefined buckets: {:?}", config.predefined_buckets);
    println!("\n🚀 Servidor iniciando en http://localhost:8080");
    println!("{}", "=".repeat(60));
    
    HttpServer::new(move || {
        let cors = Cors::permissive();
        
        App::new()
            .wrap(cors)
            .app_data(web::Data::new(config.clone()))
            .app_data(web::Data::new(s3_client.clone()))
            .route("/", web::get().to(|| async { 
                HttpResponse::Ok().json(serde_json::json!({
                    "message": "S3 Parquet Explorer API",
                    "version": "1.0.0",
                }))
            }))
            .route("/health", web::get().to(|| async { 
                HttpResponse::Ok().json(json!({
                    "status": "healthy",
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }))
            }))
            .service(handlers::buckets::list_buckets)
            .service(handlers::objects::list_objects)
            .service(handlers::explore::explore_bucket)
            .service(handlers::metadata::get_file_metadata)
            .service(handlers::data::get_file_data)
            .service(handlers::download::download_parquet)
            .service(handlers::search::search_parquet_files)
            .service(handlers::copy::copy_s3_object)
            .service(handlers::copy::bulk_copy_s3_objects)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}