use crate::s3_client::S3Client;
use crate::models::SchemaField;  // ← Agregar esta línea
use polars::prelude::*;
use serde_json::{json, Value, Number};
use std::io::Cursor;
use log::{info, error};

fn any_value_to_json(any_value: AnyValue<'_>) -> Value {
    match any_value {
        AnyValue::Null => Value::Null,
        AnyValue::Boolean(v) => Value::Bool(v),
        AnyValue::Int32(v) => Value::Number(Number::from(v)),
        AnyValue::Int64(v) => Value::Number(Number::from(v)),
        AnyValue::Float32(v) => {
            if let Some(n) = Number::from_f64(v as f64) {
                Value::Number(n)
            } else {
                Value::Null
            }
        }
        AnyValue::Float64(v) => {
            if let Some(n) = Number::from_f64(v) {
                Value::Number(n)
            } else {
                Value::Null
            }
        }
        AnyValue::String(v) => Value::String(v.to_string()),
        AnyValue::Decimal(v, scale) => {
            let scale = scale as u32;
            let value_str = v.to_string();
            let float_val = if scale > 0 && value_str.len() > scale as usize {
                let int_part = &value_str[..value_str.len() - scale as usize];
                let dec_part = &value_str[value_str.len() - scale as usize..];
                format!("{}.{}", int_part, dec_part).parse::<f64>().unwrap_or(0.0)
            } else {
                value_str.parse::<f64>().unwrap_or(0.0)
            };
            
            if let Some(n) = Number::from_f64(float_val) {
                Value::Number(n)
            } else {
                Value::Null
            }
        }
        AnyValue::Date(v) => Value::String(v.to_string()),
        AnyValue::Datetime(v, _, _) => Value::Number(Number::from(v)),
        _ => Value::String(format!("{:?}", any_value)),
    }
}

pub async fn read_parquet_data(
    s3_client: &S3Client,
    bucket: &str,
    key: &str,
    limit: usize,
    _columns: Option<&Vec<String>>,
) -> Result<(Vec<Value>, Vec<String>, serde_json::Map<String, Value>), anyhow::Error> {
    
    info!("Leyendo archivo: s3://{}/{}", bucket, key);
    
    let get_resp = s3_client
        .get_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await?;
    
    let data = get_resp.body.collect().await?;
    let bytes = data.into_bytes();
    
    let cursor = Cursor::new(bytes);
    let df = ParquetReader::new(cursor)
        .finish()?
        .head(Some(limit));
    
    let columns: Vec<String> = df.get_column_names()
        .iter()
        .map(|&name| name.to_string())
        .collect();
    
    let mut dtypes = serde_json::Map::new();
    for col in &columns {
        let series = df.column(col)?;
        dtypes.insert(col.clone(), json!(format!("{:?}", series.dtype())));
    }
    
    let mut rows_json = Vec::new();
    for row_idx in 0..df.height() {
        let mut map = serde_json::Map::new();
        for col in &columns {
            let series = df.column(col)?;
            let value = match series.get(row_idx) {
                Ok(any_value) => any_value_to_json(any_value),
                Err(_) => Value::Null,
            };
            map.insert(col.clone(), value);
        }
        rows_json.push(Value::Object(map));
    }
    
    Ok((rows_json, columns, dtypes))
}

// ✅ NUEVA FUNCIÓN PARA METADATA
pub async fn get_parquet_metadata(
    s3_client: &S3Client,
    bucket: &str,
    key: &str,
) -> Result<(Vec<String>, usize, Vec<SchemaField>), anyhow::Error> {
    
    info!("📋 Leyendo metadata de: s3://{}/{}", bucket, key);
    
    let get_resp = s3_client
        .get_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await?;
    
    let data = get_resp.body.collect().await?;
    let bytes = data.into_bytes();
    let cursor = Cursor::new(bytes);
    
    let df = ParquetReader::new(cursor).finish()?;
    
    let columns: Vec<String> = df.get_column_names()
        .iter()
        .map(|&name| name.to_string())
        .collect();
    
    let row_count = df.height();
    
    let schema_fields: Vec<SchemaField> = df
        .get_columns()
        .iter()
        .map(|col| SchemaField {
            name: col.name().to_string(),
            r#type: format!("{:?}", col.dtype()),
            nullable: true,
        })
        .collect();
    
    info!("✅ Metadata: {} columnas, {} filas", columns.len(), row_count);
    
    Ok((columns, row_count, schema_fields))
}