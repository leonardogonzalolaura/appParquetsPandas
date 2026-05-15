use polars::prelude::*;
use std::io::{Read, Seek};
use serde_json::{json, Value};
use std::collections::HashMap;

pub fn read_parquet_metadata<R: Read + Seek>(
    reader: R,
) -> Result<(Vec<String>, usize, Vec<crate::models::SchemaField>), anyhow::Error> {
    let parquet_reader = ParquetReader::new(reader);
    let schema = parquet_reader.schema()?;
    let num_rows = parquet_reader.num_rows()?;
    
    let columns: Vec<String> = schema
        .iter()
        .map(|f| f.name().to_string())
        .collect();
    
    let schema_fields: Vec<crate::models::SchemaField> = schema
        .iter()
        .map(|f| crate::models::SchemaField {
            name: f.name().to_string(),
            r#type: format!("{:?}", f.dtype()),
            nullable: true,
        })
        .collect();
    
    Ok((columns, num_rows, schema_fields))
}

pub fn read_parquet_data<R: Read + Seek>(
    reader: R,
    limit: usize,
    selected_columns: Option<&Vec<String>>,
) -> Result<(Vec<Value>, Vec<String>, serde_json::Map<String, Value>), anyhow::Error> {
    let mut parquet_reader = ParquetReader::new(reader);
    
    let df = if let Some(cols) = selected_columns {
        let projection: Vec<String> = cols.clone();
        parquet_reader
            .with_projection(Some(projection))
            .finish()?
    } else {
        parquet_reader.finish()?
    };
    
    let df = df.head(Some(limit));
    
    let columns: Vec<String> = df.get_column_names()
        .iter()
        .map(|&name| name.to_string())
        .collect();
    
    let mut dtypes = serde_json::Map::new();
    for col in &columns {
        let series = df.column(col)?;
        dtypes.insert(col.clone(), json!(format!("{:?}", series.dtype())));
    }
    
    // Convertir DataFrame a JSON
    let rows_json: Vec<Value> = df
        .rows()
        .iter()
        .map(|row| {
            let mut map = serde_json::Map::new();
            for (i, col) in columns.iter().enumerate() {
                let value = row.get(i).map(|v| format!("{:?}", v)).unwrap_or_default();
                map.insert(col.clone(), json!(value));
            }
            Value::Object(map)
        })
        .collect();
    
    Ok((rows_json, columns, dtypes))
}