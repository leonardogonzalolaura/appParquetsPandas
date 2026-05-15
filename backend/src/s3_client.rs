use aws_config::BehaviorVersion;
use aws_sdk_s3::Client;
use aws_sdk_s3::config::{Region, Credentials};

pub type S3Client = Client;

pub async fn create_s3_client(region: &str) -> Client {
    let config = aws_config::defaults(BehaviorVersion::latest())
        .region(Region::new(region.to_string()))
        .load()
        .await;
    
    Client::new(&config)
}

pub async fn create_dynamic_s3_client(
    region: &str,
    access_key: &str,
    secret_key: &str,
) -> Client {
    let credentials = Credentials::new(
        access_key,
        secret_key,
        None,
        None,
        "manual"
    );

    let config = aws_config::defaults(BehaviorVersion::latest())
        .region(Region::new(region.to_string()))
        .credentials_provider(credentials)
        .load()
        .await;
    
    Client::new(&config)
}