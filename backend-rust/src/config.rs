use dotenv::dotenv;
use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub aws_region: String,
    pub predefined_buckets: Vec<String>,
    pub max_file_size_mb: u64,
    pub default_page_size: usize,
    pub max_page_size: usize,
}

impl Config {
    pub fn from_env() -> Self {
        dotenv().ok();
        
        let raw_buckets = env::var("S3_PREDEFINED_BUCKETS")
            .unwrap_or_else(|_| "".to_string());
        
        let predefined_buckets: Vec<String> = raw_buckets
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
        
        Config {
            aws_region: env::var("AWS_REGION").unwrap_or_else(|_| "us-east-1".to_string()),
            predefined_buckets,
            max_file_size_mb: env::var("MAX_FILE_SIZE_MB")
                .unwrap_or_else(|_| "100".to_string())
                .parse()
                .unwrap_or(100),
            default_page_size: env::var("DEFAULT_PAGE_SIZE")
                .unwrap_or_else(|_| "100".to_string())
                .parse()
                .unwrap_or(100),
            max_page_size: env::var("MAX_PAGE_SIZE")
                .unwrap_or_else(|_| "1000".to_string())
                .parse()
                .unwrap_or(1000),
        }
    }
}