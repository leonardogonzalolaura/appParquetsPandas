use polars::prelude::*;
use serde_json::{json, Value};
use std::io::Cursor;

pub fn read_csv_metadata(
    data: &[u8],
) -> Result<(Vec<String>, Vec<crate::models::SchemaField>), anyhow::Error> {
    let cursor = Cursor::new(data);
    let df = CsvReader::new(cursor)
        .has_header(true)
        .with_n_rows(Some(100))
        .finish()?;
    
    let columns: Vec<String> = df.get_column_names()
        .iter()
        .map(|&name| name.to_string())
        .collect();
    
    let schema_fields: Vec<crate::models::SchemaField> = df
        .get_columns()
        .iter()
        .map(|col| crate::models::SchemaField {
            name: col.name().to_string(),
            r#type: format!("{:?}", col.dtype()),
            nullable: true,
        })
        .collect();
    
    Ok((columns, schema_fields))
}

pub fn read_csv_data(
    data: &[u8],
    limit: usize,
    selected_columns: Option<&Vec<String>>,
) -> Result<(Vec<Value>, Vec<String>, serde_json::Map<String, Value>), anyhow::Error> {
    let cursor = Cursor::new(data);
    
    let mut reader = CsvReader::new(cursor)
        .has_header(true);
    
    if let Some(cols) = selected_columns {
        reader = reader.with_projection(Some(cols.clone()));
    }
    
    let df = reader.finish()?;
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