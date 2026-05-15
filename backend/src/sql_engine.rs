use datafusion::arrow as arrow;
use datafusion::prelude::*;
use datafusion::error::DataFusionError;
use object_store::aws::{AmazonS3Builder, AwsCredential};
use std::sync::Arc;
use std::collections::HashMap;
use datafusion::arrow::array::Array;
use url::Url;

pub struct SqlEngine {
    ctx: SessionContext,
    registered_tables: HashMap<String, String>,
}

impl SqlEngine {
    pub async fn new(region: &str) -> Result<Self, DataFusionError> {
        let ctx = SessionContext::new();

        let access_key = std::env::var("AWS_ACCESS_KEY_ID").ok();
        let secret_key = std::env::var("AWS_SECRET_ACCESS_KEY").ok();
        
        let mut s3_builder = AmazonS3Builder::new()
        .with_region(region);

        if let (Some(key), Some(secret)) = (access_key, secret_key) {
        s3_builder = s3_builder
            .with_access_key_id(key)
            .with_secret_access_key(secret);
        }

        s3_builder = s3_builder.with_bucket_name("belc_planning_ecosystem_dev");

        let s3 = s3_builder
        .build()
        .map_err(|e| DataFusionError::External(Box::new(e)))?;
    
        let s3_url = Url::parse("s3://").map_err(|e| DataFusionError::External(Box::new(e)))?;

        println!("🚀s3 client configurado para región: {}", s3);    

        ctx.runtime_env()
            .register_object_store(&s3_url, Arc::new(s3));
                
        Ok(Self {
            ctx,
            registered_tables: HashMap::new(),
        })
    }
    
    pub async fn register_table(&mut self, table_name: &str, bucket: &str, prefix: &str) -> Result<usize, DataFusionError> {
        let prefix_clean = prefix.trim_start_matches('/').trim_end_matches('/');
        let s3_path = if prefix_clean.is_empty() {
            format!("s3://{}/", bucket)
        } else {
            format!("s3://{}/{}/", bucket, prefix_clean)
        };
        let full_pattern = format!("{}{}.parquet", s3_path, table_name);
        
        println!("📥 Registrando tabla '{}' desde: {}", table_name, s3_path);
        
        self.ctx
            .register_parquet(table_name, &s3_path, ParquetReadOptions::default())
            .await?;
        
        self.registered_tables.insert(table_name.to_string(), s3_path);
        
        // Intentar obtener el conteo
        let count_sql = format!("SELECT COUNT(*) as count FROM {}", table_name);
        let df = self.ctx.sql(&count_sql).await?;
        let batches = df.collect().await?;
        let row_count = if !batches.is_empty() {
            let count_array = batches[0].column(0);
            count_array.as_any()
                .downcast_ref::<arrow::array::Int64Array>()
                .map(|arr| arr.value(0) as usize)
                .unwrap_or(0)
        } else {
            0
        };
        
        println!("✅ Tabla '{}' registrada: {} filas", table_name, row_count);
        
        Ok(row_count)
    }
    
    pub async fn execute_query(&self, sql: &str) -> Result<Vec<serde_json::Value>, DataFusionError> {
        println!("📊 Ejecutando SQL: {}", sql);
        
        let df = self.ctx.sql(sql).await?;
        let batches = df.collect().await?;
        
        let mut results = Vec::new();
        
        for batch in batches {
            let schema = batch.schema();
            let rows = batch.num_rows();
            let cols = batch.num_columns();
            
            for row_idx in 0..rows {
                let mut row_map = serde_json::Map::new();
                for col_idx in 0..cols {
                    let field = schema.field(col_idx);
                    let column_name = field.name();
                    let value = Self::batch_value_to_json(&batch, col_idx, row_idx);
                    row_map.insert(column_name.clone(), value);
                }
                results.push(serde_json::Value::Object(row_map));
            }
        }
        
        Ok(results)
    }
    
    fn batch_value_to_json(batch: &arrow::record_batch::RecordBatch, col_idx: usize, row_idx: usize) -> serde_json::Value {
        let array = batch.column(col_idx);
        
        use arrow::array::{
            StringArray, Int64Array, Int32Array, Float64Array, Float32Array, 
            BooleanArray, TimestampNanosecondArray
        };
        
        if let Some(arr) = array.as_any().downcast_ref::<StringArray>() {
            if !arr.is_null(row_idx) {
                return serde_json::Value::String(arr.value(row_idx).to_string());
            }
        } else if let Some(arr) = array.as_any().downcast_ref::<Int64Array>() {
            if !arr.is_null(row_idx) {
                return serde_json::Value::Number(serde_json::Number::from(arr.value(row_idx)));
            }
        } else if let Some(arr) = array.as_any().downcast_ref::<Int32Array>() {
            if !arr.is_null(row_idx) {
                return serde_json::Value::Number(serde_json::Number::from(arr.value(row_idx)));
            }
        } else if let Some(arr) = array.as_any().downcast_ref::<Float64Array>() {
            if !arr.is_null(row_idx) {
                if let Some(num) = serde_json::Number::from_f64(arr.value(row_idx)) {
                    return serde_json::Value::Number(num);
                }
            }
        } else if let Some(arr) = array.as_any().downcast_ref::<Float32Array>() {
            if !arr.is_null(row_idx) {
                if let Some(num) = serde_json::Number::from_f64(arr.value(row_idx) as f64) {
                    return serde_json::Value::Number(num);
                }
            }
        } else if let Some(arr) = array.as_any().downcast_ref::<BooleanArray>() {
            if !arr.is_null(row_idx) {
                return serde_json::Value::Bool(arr.value(row_idx));
            }
        } else if let Some(arr) = array.as_any().downcast_ref::<TimestampNanosecondArray>() {
            if !arr.is_null(row_idx) {
                let timestamp = arr.value(row_idx);
                let datetime = chrono::DateTime::from_timestamp(
                    timestamp / 1_000_000_000,
                    (timestamp % 1_000_000_000) as u32
                );
                if let Some(dt) = datetime {
                    return serde_json::Value::String(dt.to_string());
                }
            }
        }
        
        serde_json::Value::Null
    }
    

    pub fn list_tables(&self) -> Vec<String> {
        self.registered_tables.keys().cloned().collect()
    }
}