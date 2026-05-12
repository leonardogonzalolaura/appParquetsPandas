use actix_web::{get, web, HttpResponse, Responder};
use serde::Deserialize;
use actix_web::http::header;

#[derive(Debug, Deserialize)]
pub struct DownloadQuery {
    bucket: String,
    key: String,
    format: Option<String>,
}

#[get("/api/download")]
pub async fn download_parquet(
    query: web::Query<DownloadQuery>,
) -> impl Responder {
    let format = query.format.as_deref().unwrap_or("csv");
    let filename = match format {
        "csv" => "data.csv",
        "json" => "data.json",
        _ => "data.parquet",
    };
    
    let content = "id,name\n1,test\n2,sample".to_string();
    
    let response = HttpResponse::Ok()
        .insert_header((header::CONTENT_TYPE, "text/csv"))
        .insert_header((header::CONTENT_DISPOSITION, format!("attachment; filename=\"{}\"", filename)))
        .body(content);
    
    response
}