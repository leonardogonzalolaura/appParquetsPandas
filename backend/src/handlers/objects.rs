use actix_web::{get, web, HttpResponse, Responder};
use serde::Deserialize;
use crate::models::S3Object;
use crate::s3_client::S3Client;
use chrono::Utc;

#[derive(Debug, Deserialize)]
pub struct ListObjectsQuery {
    prefix: Option<String>,
    delimiter: Option<String>,
    max_keys: Option<i32>,
}

#[get("/api/buckets/{bucket}/objects")]
pub async fn list_objects(
    bucket: web::Path<String>,
    query: web::Query<ListObjectsQuery>,
    s3_client: web::Data<S3Client>,
) -> impl Responder {
    let bucket_name = bucket.into_inner();
    let prefix = query.prefix.as_deref().unwrap_or("");
    let delimiter = query.delimiter.as_deref().unwrap_or("/");
    let max_keys = query.max_keys.unwrap_or(1000);
    
    let mut request = s3_client
        .list_objects_v2()
        .bucket(&bucket_name)
        .delimiter(delimiter)
        .max_keys(max_keys);
    
    if !prefix.is_empty() {
        request = request.prefix(prefix);
    }
    
    let response = match request.send().await {
        Ok(resp) => resp,
        Err(e) => return HttpResponse::InternalServerError().body(format!("Error: {}", e)),
    };
    
    let mut objects = Vec::new();
    let mut folders = std::collections::HashSet::new();
    
    // Procesar carpetas
    for prefix_item in response.common_prefixes() {
        if let Some(prefix_str) = prefix_item.prefix() {
            let folder_key = prefix_str.to_string();
            let folder_name = folder_key
                .trim_end_matches('/')
                .split('/')
                .last()
                .unwrap_or("")
                .to_string();
            
            objects.push(S3Object {
                key: folder_key.clone(),
                name: folder_name,
                last_modified: Utc::now().to_rfc3339(),
                size: 0,
                size_mb: 0.0,
                r#type: "folder".to_string(),
                is_folder: true,
                etag: None,
            });
            folders.insert(folder_key);
        }
    }
    
    // Procesar archivos
    for obj in response.contents() {
        let key = obj.key().unwrap_or("");
        
        if key.ends_with('/') || folders.contains(key) {
            continue;
        }
        
        let supported_extensions = [".parquet", ".csv", ".json", ".txt"];
        let lower_key = key.to_lowercase();
        let is_supported = supported_extensions.iter().any(|ext| lower_key.ends_with(ext));
        
        if is_supported {
            let file_name = key.split('/').last().unwrap_or("");
            let size = obj.size();  // Esto es Option<i64>
            let size_value = size.unwrap_or(0);  // ✅ Extraer el valor o usar 0
            
            objects.push(S3Object {
                key: key.to_string(),
                name: file_name.to_string(),
                last_modified: obj.last_modified()
                    .map(|t| t.to_string())
                    .unwrap_or_else(|| Utc::now().to_rfc3339()),
                size: size_value,  // ✅ Ahora es i64
                size_mb: size_value as f64 / (1024.0 * 1024.0),  // ✅ Convertir correctamente
                r#type: "file".to_string(),
                is_folder: false,
                etag: obj.e_tag().map(|e| e.to_string()),
            });
        }
    }
    
    objects.sort_by(|a, b| {
        match (a.is_folder, b.is_folder) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    HttpResponse::Ok().json(objects)
}