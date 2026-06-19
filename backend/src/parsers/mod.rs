pub mod csv;
pub mod json;

pub enum FileType {
    Parquet,
    Csv,
    Json,
}

pub fn detect_file_type(key: &str) -> FileType {
    let lower = key.to_lowercase();
    if lower.ends_with(".csv") {
        FileType::Csv
    } else if lower.ends_with(".json") {
        FileType::Json
    } else {
        FileType::Parquet
    }
}
