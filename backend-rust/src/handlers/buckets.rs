use actix_web::{get, web, HttpResponse, Responder};
use crate::config::Config;
use crate::models::BucketInfo;
use chrono::Utc;

#[get("/api/buckets")]
pub async fn list_buckets(
    config: web::Data<Config>,
) -> impl Responder {
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