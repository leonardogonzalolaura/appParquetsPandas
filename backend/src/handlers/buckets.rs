use actix_web::{get, web, HttpResponse, Responder, HttpRequest};
use crate::config::Config;
use crate::models::BucketInfo;
use crate::s3_client::S3Client;
use crate::handlers::get_s3_client;
use chrono::Utc;

#[get("/api/buckets")]
pub async fn list_buckets(
    req: HttpRequest,
    config: web::Data<Config>,
    default_s3: web::Data<S3Client>,
) -> impl Responder {
    let client = get_s3_client(&req, &default_s3, &config).await;
    
    // Si tenemos credenciales dinámicas (headers presentes), intentamos listar de S3
    let has_dynamic = req.headers().contains_key("x-aws-access-key");
    
    if has_dynamic {
        match client.list_buckets().send().await {
            Ok(output) => {
                let buckets: Vec<BucketInfo> = output.buckets().iter().map(|b| {
                    BucketInfo {
                        name: b.name().unwrap_or_default().to_string(),
                        creation_date: b.creation_date().map(|d| d.to_string()).unwrap_or_else(|| Utc::now().to_rfc3339()),
                        object_count: None,
                        size_gb: None,
                    }
                }).collect();
                return HttpResponse::Ok().json(buckets);
            },
            Err(e) => {
                eprintln!("Error listing dynamic buckets: {:?}", e);
                
                // Intentar extraer un mensaje más legible del error de AWS
                let error_detail = format!("{}", e);
                let clean_message = if error_detail.contains("AccessDenied") {
                    "Acceso Denegado: Tu usuario de IAM no tiene permiso 's3:ListAllMyBuckets'. Puedes agregar buckets manualmente en la configuración del perfil."
                } else {
                    &error_detail
                };

                return HttpResponse::Forbidden().json(serde_json::json!({
                    "error": "S3 Error",
                    "detail": clean_message,
                    "code": "AWS_S3_ERROR"
                }));
            }
        }
    }



    // Fallback: Lista de buckets predefinidos (comportamiento original)
    let mut buckets = Vec::new();
    for bucket_name in &config.predefined_buckets {
        buckets.push(BucketInfo {
            name: bucket_name.clone(),
            creation_date: Utc::now().to_rfc3339(),
            object_count: None,
            size_gb: None,
        });
    }
    
    HttpResponse::Ok().json(buckets)
}