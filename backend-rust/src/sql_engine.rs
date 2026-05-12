use datafusion::prelude::*;
use datafusion::error::DataFusionError;
use aws_sdk_s3::Client as S3Client;
use std::sync::Arc;
use serde_json::Value;

pub struct SqlEngine {
    ctx: SessionContext,
    bucket: String,  // Opcional: bucket por defecto
}

impl SqlEngine {
    pub async fn new(s3_client: Arc<S3Client>, bucket: Option<String>, region: &str) -> Result<Self, anyhow::Error> {
        let ctx = SessionContext::new();
        
        use object_store::aws::{AmazonS3Builder};
        
        // Configurar ObjectStore para S3 usando el region
        let mut builder = AmazonS3Builder::new()
            .with_region(region);
        
        // Si hay un bucket específico, configurarlo
        if let Some(ref b) = bucket {
            builder = builder.with_bucket_name(b);
        }
        
        let object_store = builder.build()?;
        
        ctx.runtime_env()
            .register_object_store("s3", Arc::new(object_store));
        
        Ok(Self { ctx, bucket: bucket.unwrap_or_default() })
    }
    
    pub async fn register_parquet_table(&self, table_name: &str, s3_path: &str) -> Result<(), DataFusionError> {
        // s3_path puede ser:
        // - "s3://bucket/prefix/*.parquet"
        // - "prefix/" (asume el bucket del engine)
        let full_path = if s3_path.starts_with("s3://") {
            s3_path.to_string()
        } else {
            format!("s3://{}/{}*.parquet", self.bucket, s3_path)
        };
        
        println!("Registrando tabla '{}' desde: {}", table_name, full_path);
        
        self.ctx
            .register_parquet(table_name, &full_path, ParquetReadOptions::default())
            .await?;
        Ok(())
    }
    
    pub async fn execute_query(&self, sql: &str) -> Result<Vec<Value>, DataFusionError> {
        let df = self.ctx.sql(sql).await?;
        let batches = df.collect().await?;
        
        let mut results = Vec::new();
        for batch in batches {
            let schema = batch.schema();
            let rows = batch.num_rows();
            
            for row_idx in 0..rows {
                let mut row_map = serde_json::Map::new();
                for (col_idx, field) in schema.fields().iter().enumerate() {
                    let value = self.value_to_json(&batch, col_idx, row_idx);
                    row_map.insert(field.name().clone(), value);
                }
                results.push(Value::Object(row_map));
            }
        }
        
        Ok(results)
    }
    
    fn value_to_json(&self, batch: &datafusion::arrow::record_batch::RecordBatch, col_idx: usize, row_idx: usize) -> Value {
        let array = batch.column(col_idx);
        
        // Manejar diferentes tipos de datos Arrow
        if let Some(arr) = array.as_any().downcast_ref::<datafusion::arrow::array::StringArray>() {
            if !arr.is_null(row_idx) {
                return Value::String(arr.value(row_idx).to_string());
            }
        } else if let Some(arr) = array.as_any().downcast_ref::<datafusion::arrow::array::Int64Array>() {
            if !arr.is_null(row_idx) {
                return Value::Number(serde_json::Number::from(arr.value(row_idx)));
            }
        } else if let Some(arr) = array.as_any().downcast_ref::<datafusion::arrow::array::Int32Array>() {
            if !arr.is_null(row_idx) {
                return Value::Number(serde_json::Number::from(arr.value(row_idx)));
            }
        } else if let Some(arr) = array.as_any().downcast_ref::<datafusion::arrow::array::Float64Array>() {
            if !arr.is_null(row_idx) {
                if let Some(num) = serde_json::Number::from_f64(arr.value(row_idx)) {
                    return Value::Number(num);
                }
            }
        } else if let Some(arr) = array.as_any().downcast_ref::<datafusion::arrow::array::Float32Array>() {
            if !arr.is_null(row_idx) {
                if let Some(num) = serde_json::Number::from_f64(arr.value(row_idx) as f64) {
                    return Value::Number(num);
                }
            }
        } else if let Some(arr) = array.as_any().downcast_ref::<datafusion::arrow::array::BooleanArray>() {
            if !arr.is_null(row_idx) {
                return Value::Bool(arr.value(row_idx));
            }
        } else if let Some(arr) = array.as_any().downcast_ref::<datafusion::arrow::array::TimestampNanosecondArray>() {
            if !arr.is_null(row_idx) {
                let timestamp = arr.value(row_idx);
                return Value::String(chrono::NaiveDateTime::from_timestamp_opt(timestamp / 1_000_000_000, (timestamp % 1_000_000_000) as u32)
                    .map(|dt| dt.to_string())
                    .unwrap_or_else(|| timestamp.to_string()));
            }
        }
        
        Value::Null
    }
    
    // Método para listar tablas registradas
    pub fn list_tables(&self) -> Vec<String> {
        self.ctx.tables().unwrap_or_else(|_| vec![])
    }
}