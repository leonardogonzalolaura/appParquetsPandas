use serde_json::{Value, json};
use std::collections::HashMap;

pub fn read_json_metadata(content: &str) -> Result<(Vec<String>, usize), anyhow::Error> {
    let data: Value = serde_json::from_str(content)?;
    
    match data {
        Value::Array(arr) if !arr.is_empty() => {
            if let Some(first) = arr.first() {
                if let Value::Object(obj) = first {
                    let columns: Vec<String> = obj.keys().cloned().collect();
                    return Ok((columns, arr.len()));
                }
            }
            Ok((vec!["value".to_string()], arr.len()))
        }
        Value::Object(obj) => {
            let columns: Vec<String> = obj.keys().cloned().collect();
            Ok((columns, 1))
        }
        _ => Ok((vec!["data".to_string()], 1)),
    }
}

pub fn read_json_data(
    content: &str,
    limit: usize,
    selected_columns: Option<&Vec<String>>,
) -> Result<(Vec<Value>, Vec<String>), anyhow::Error> {
    let data: Value = serde_json::from_str(content)?;
    
    let rows = match data {
        Value::Array(arr) => arr,
        Value::Object(obj) => vec![Value::Object(obj)],
        _ => vec![data],
    };
    
    let limited_rows: Vec<Value> = rows.into_iter().take(limit).collect();
    
    // Extraer columnas
    let columns = if let Some(cols) = selected_columns {
        cols.clone()
    } else if let Some(first_row) = limited_rows.first() {
        match first_row {
            Value::Object(obj) => obj.keys().cloned().collect(),
            _ => vec!["value".to_string()],
        }
    } else {
        vec![]
    };
    
    // Filtrar filas por columnas seleccionadas
    let filtered_rows: Vec<Value> = limited_rows
        .into_iter()
        .map(|row| {
            if let Value::Object(obj) = row {
                let mut filtered = serde_json::Map::new();
                for col in &columns {
                    if let Some(value) = obj.get(col) {
                        filtered.insert(col.clone(), value.clone());
                    } else {
                        filtered.insert(col.clone(), json!(null));
                    }
                }
                Value::Object(filtered)
            } else {
                row
            }
        })
        .collect();
    
    Ok((filtered_rows, columns))
}