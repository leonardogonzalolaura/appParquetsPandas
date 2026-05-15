use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BucketInfo {
    pub name: String,
    pub creation_date: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub object_count: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size_gb: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct S3Object {
    pub key: String,
    pub name: String,
    pub last_modified: String,
    pub size: i64,
    pub size_mb: f64,
    pub r#type: String,
    pub is_folder: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub etag: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub columns: Vec<String>,
    pub num_columns: usize,
    pub row_count: i64,
    pub num_rows: Option<i64>,
    pub file_size: i64,
    pub schema: SchemaInfo,
    pub created_at: Option<String>,
    pub format_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaInfo {
    pub fields: Vec<SchemaField>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaField {
    pub name: String,
    pub r#type: String,
    pub nullable: bool,
}

#[derive(Debug, Deserialize)]
pub struct ParquetDataRequest {
    pub bucket: String,
    pub key: String,
    pub limit: Option<usize>,
    pub columns: Option<Vec<String>>,
    pub filters: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct CopyObjectRequest {
    pub source_bucket: String,
    pub source_key: String,
    pub dest_bucket: String,
    pub dest_key: String,
}

#[derive(Debug, Deserialize)]
pub struct BulkCopyRequest {
    pub source_bucket: String,
    pub source_keys: Vec<String>,
    pub dest_bucket: String,
    pub dest_path: String,
}

#[derive(Debug, Serialize)]
pub struct FolderItem {
    pub name: String,
    pub path: String,
    pub r#type: String,
}

#[derive(Debug, Serialize)]
pub struct FileItem {
    pub name: String,
    pub key: String,
    pub size: i64,
    pub size_mb: f64,
    pub last_modified: String,
    pub r#type: String,
}

#[derive(Debug, Serialize)]
pub struct ExploreResponse {
    pub bucket: String,
    pub current_path: String,
    pub folders: Vec<FolderItem>,
    pub files: Vec<FileItem>,
    pub parent_path: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TableDataResponse {
    pub data: Vec<serde_json::Value>,
    pub columns: Vec<String>,
    pub row_count: usize,
    pub dtypes: serde_json::Map<String, serde_json::Value>,
    pub file_type: String,
    pub is_tabular: bool,
}