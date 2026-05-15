use actix_web::{get, web, HttpResponse, Responder, HttpRequest};
use serde::Deserialize;
use crate::models::{ExploreResponse, FolderItem, FileItem};
use crate::s3_client::S3Client;
use crate::handlers::get_s3_client;
use crate::config::Config;

#[derive(Debug, Deserialize)]
pub struct ExploreQuery {
    path: Option<String>,
}

#[get("/api/buckets/{bucket}/explore")]
pub async fn explore_bucket(
    req: HttpRequest,
    bucket: web::Path<String>,
    query: web::Query<ExploreQuery>,
    default_s3: web::Data<S3Client>,
    config: web::Data<Config>,
) -> impl Responder {
    let s3_client = get_s3_client(&req, &default_s3, &config).await;

    let bucket_name = bucket.into_inner();
    let raw_path = query.path.as_deref().unwrap_or("");
    let normalized_path = raw_path.trim_matches('/');
    
    let prefix = if normalized_path.is_empty() {
        None
    } else {
        Some(format!("{}/", normalized_path))
    };
    
    let mut request = s3_client
        .list_objects_v2()
        .bucket(&bucket_name)
        .delimiter("/")
        .max_keys(1000);
    
    if let Some(p) = &prefix {
        request = request.prefix(p);
    }
    
    let response = match request.send().await {
        Ok(resp) => resp,
        Err(e) => return HttpResponse::InternalServerError().body(format!("Error: {}", e)),
    };
    
    let mut folders = Vec::new();
    let mut files = Vec::new();
    
    // Procesar carpetas
    for common_prefix in response.common_prefixes() {
        if let Some(folder_key) = common_prefix.prefix() {
            let folder_path = folder_key.trim_end_matches('/');
            let folder_name = folder_path
                .split('/')
                .last()
                .unwrap_or("")
                .to_string();
            
            folders.push(FolderItem {
                name: folder_name,
                path: folder_path.to_string(),
                r#type: "folder".to_string(),
            });
        }
    }
    
    // Procesar archivos
    for obj in response.contents() {
    let key = obj.key().unwrap_or("");
    
    if key.ends_with('/') {
        continue;
    }
    
    let supported_extensions = [".parquet", ".csv", ".json", ".txt"];
    let lower_key = key.to_lowercase();
    let is_supported = supported_extensions.iter().any(|ext| lower_key.ends_with(ext));
    
    if is_supported {
        let file_name = key.split('/').last().unwrap_or("");
        let size = obj.size();  // Esto es Option<i64>
        let size_value = size.unwrap_or(0);  // ✅ Extraer el valor o usar 0
        
        files.push(FileItem {
            name: file_name.to_string(),
            key: key.to_string(),
            size: size_value,  // ✅ Ahora es i64
            size_mb: size_value as f64 / (1024.0 * 1024.0),  // ✅ Convertir correctamente
            last_modified: obj.last_modified()
                .map(|t| t.to_string())
                .unwrap_or_else(|| "unknown".to_string()),
            r#type: "file".to_string(),
        });
    }
}
    
    // Calcular ruta padre
    let parent_path = if normalized_path.is_empty() {
        None
    } else {
        let parts: Vec<&str> = normalized_path.split('/').collect();
        if parts.len() > 1 {
            Some(parts[..parts.len()-1].join("/"))
        } else {
            Some("".to_string())
        }
    };
    
    folders.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    
    let response = ExploreResponse {
        bucket: bucket_name,
        current_path: if normalized_path.is_empty() { "/".to_string() } else { normalized_path.to_string() },
        folders,
        files,
        parent_path,
    };
    
    HttpResponse::Ok().json(response)
}