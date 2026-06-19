use actix_web::{post, web, HttpResponse, Responder, HttpRequest};
use crate::models::ParquetDataRequest;
use crate::s3_client::S3Client;
use crate::parquet_parser::read_parquet_data;
use crate::parsers;
use crate::handlers::get_s3_client;
use crate::config::Config;
use log::{info, error};

#[post("/api/file/data")]
pub async fn get_file_data(
    req: HttpRequest,
    request: web::Json<ParquetDataRequest>,
    default_s3: web::Data<S3Client>,
    config: web::Data<Config>,
) -> impl Responder {
    let s3_client = get_s3_client(&req, &default_s3, &config).await;

    info!("=== INICIO get_file_data ===");
    info!("Request bucket: {}", request.bucket);
    info!("Request key: {}", request.key);
    info!("Request limit: {:?}", request.limit);

    let bucket = &request.bucket;
    let key = &request.key;
    let limit = request.limit.unwrap_or(100);
    let columns = request.columns.as_ref();
    let filters = request.filters.as_ref();

    match parsers::detect_file_type(key) {
        parsers::FileType::Json => {
            let get_resp = match s3_client.get_object().bucket(bucket).key(key).send().await {
                Ok(r) => r,
                Err(e) => {
                    error!("Error downloading JSON: {}", e);
                    return HttpResponse::InternalServerError().body(format!("Error: {}", e));
                }
            };
            let data = match get_resp.body.collect().await {
                Ok(d) => d.into_bytes(),
                Err(e) => return HttpResponse::InternalServerError().body(format!("Error: {}", e)),
            };
            let content = String::from_utf8_lossy(&data);
            match parsers::json::read_json_data(&content, limit, columns) {
                Ok((rows, cols)) => {
                    let response = crate::models::TableDataResponse {
                        data: rows,
                        columns: cols,
                        row_count: 0,
                        dtypes: serde_json::Map::new(),
                        file_type: "json".to_string(),
                        is_tabular: true,
                    };
                    HttpResponse::Ok().json(response)
                }
                Err(e) => {
                    error!("Error parsing JSON: {}", e);
                    HttpResponse::InternalServerError().body(format!("Error: {}", e))
                }
            }
        }
        parsers::FileType::Csv => {
            let get_resp = match s3_client.get_object().bucket(bucket).key(key).send().await {
                Ok(r) => r,
                Err(e) => {
                    error!("Error downloading CSV: {}", e);
                    return HttpResponse::InternalServerError().body(format!("Error: {}", e));
                }
            };
            let data = match get_resp.body.collect().await {
                Ok(d) => d.into_bytes(),
                Err(e) => return HttpResponse::InternalServerError().body(format!("Error: {}", e)),
            };
            match parsers::csv::read_csv_data(&data, limit, columns) {
                Ok((rows, cols, dtypes)) => {
                    let row_count = rows.len();
                    let response = crate::models::TableDataResponse {
                        data: rows,
                        columns: cols,
                        row_count,
                        dtypes,
                        file_type: "csv".to_string(),
                        is_tabular: true,
                    };
                    HttpResponse::Ok().json(response)
                }
                Err(e) => {
                    error!("Error parsing CSV: {}", e);
                    HttpResponse::InternalServerError().body(format!("Error: {}", e))
                }
            }
        }
        _ => {
            info!("Llamando a read_parquet_data con bucket={}, key={}, limit={}", bucket, key, limit);

            match read_parquet_data(&s3_client, bucket, key, limit, columns, filters).await {
                Ok((data, columns, dtypes)) => {
                    let row_count = data.len();
                    info!("Exito! Filas leidas: {}", row_count);

                    let response = crate::models::TableDataResponse {
                        data,
                        columns,
                        row_count,
                        dtypes,
                        file_type: "parquet".to_string(),
                        is_tabular: true,
                    };
                    HttpResponse::Ok().json(response)
                }
                Err(e) => {
                    error!("Error en read_parquet_data: {}", e);
                    error!("Bucket: {}", bucket);
                    error!("Key: {}", key);
                    HttpResponse::InternalServerError().body(format!("Error: {}", e))
                }
            }
        }
    }
}