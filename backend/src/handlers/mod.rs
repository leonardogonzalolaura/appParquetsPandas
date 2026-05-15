pub mod buckets;
pub mod objects;
pub mod explore;
pub mod metadata;
pub mod data;
pub mod download;
pub mod search;
pub mod copy;
pub mod sql;

pub use sql::{execute_sql, register_table, list_registered_tables};

use actix_web::{HttpRequest, web};
use crate::s3_client::{S3Client, create_dynamic_s3_client};
use crate::config::Config;

pub async fn get_s3_client(
    req: &HttpRequest,
    default_client: &S3Client,
    config: &Config,
) -> S3Client {
    let access_key = req.headers().get("x-aws-access-key").and_then(|h| h.to_str().ok());
    let secret_key = req.headers().get("x-aws-secret-key").and_then(|h| h.to_str().ok());
    let region = req.headers().get("x-aws-region").and_then(|h| h.to_str().ok());

    match (access_key, secret_key, region) {
        (Some(ak), Some(sk), Some(r)) => {
            create_dynamic_s3_client(r, ak, sk).await
        },
        _ => default_client.clone()
    }
}