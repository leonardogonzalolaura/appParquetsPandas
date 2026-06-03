use actix_web::{get, web, HttpResponse, Responder, HttpRequest};
use serde::Deserialize;
use actix_web::http::header;
use crate::s3_client::S3Client;
use crate::handlers::get_s3_client;
use crate::config::Config;

#[derive(Debug, Deserialize)]
pub struct DownloadQuery {
    bucket: String,
    key: String,
}

#[get("/api/download")]
pub async fn download_file(
    req: HttpRequest,
    query: web::Query<DownloadQuery>,
    default_s3: web::Data<S3Client>,
    config: web::Data<Config>,
) -> impl Responder {
    let s3_client = get_s3_client(&req, &default_s3, &config).await;

    let result = s3_client
        .get_object()
        .bucket(&query.bucket)
        .key(&query.key)
        .send()
        .await;

    match result {
        Ok(resp) => {
            let file_name = query.key.split('/').last().unwrap_or("download");
            let content_type = resp.content_type()
                .unwrap_or("application/octet-stream")
                .to_string();

            let body = match resp.body.collect().await {
                Ok(bytes) => bytes.into_bytes(),
                Err(e) => return HttpResponse::InternalServerError().body(format!("Error leyendo cuerpo: {}", e)),
            };

            HttpResponse::Ok()
                .insert_header((header::CONTENT_TYPE, content_type))
                .insert_header((
                    header::CONTENT_DISPOSITION,
                    format!("attachment; filename=\"{}\"", file_name),
                ))
                .body(body)
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error descargando: {}", e)),
    }
}
