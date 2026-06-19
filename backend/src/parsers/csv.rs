use serde_json::{json, Value};

pub fn read_csv_metadata(
    data: &[u8],
) -> Result<(Vec<String>, Vec<crate::models::SchemaField>), anyhow::Error> {
    let content = String::from_utf8_lossy(data);
    let lines: Vec<&str> = content.lines().collect();

    if lines.is_empty() {
        return Ok((vec![], vec![]));
    }

    let columns: Vec<String> = lines[0]
        .split(',')
        .map(|s| s.trim().trim_matches('"').to_string())
        .filter(|s| !s.is_empty())
        .collect();

    let _row_count = if lines.len() > 1 { lines.len() - 1 } else { 0 };

    let schema_fields: Vec<crate::models::SchemaField> = columns
        .iter()
        .map(|name| crate::models::SchemaField {
            name: name.clone(),
            r#type: "String".to_string(),
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
    let content = String::from_utf8_lossy(data);
    let lines: Vec<&str> = content.lines().collect();

    if lines.len() < 2 {
        return Ok((vec![], vec![], serde_json::Map::new()));
    }

    let all_columns: Vec<String> = lines[0]
        .split(',')
        .map(|s| s.trim().trim_matches('"').to_string())
        .filter(|s| !s.is_empty())
        .collect();

    let cols = match selected_columns {
        Some(filtered) => {
            let mut result = Vec::new();
            for col in all_columns.iter() {
                if filtered.contains(col) {
                    result.push(col.clone());
                }
            }
            result
        }
        None => all_columns.clone(),
    };

    let col_indices: Vec<usize> = cols
        .iter()
        .filter_map(|c| all_columns.iter().position(|a| a == c))
        .collect();

    let data_lines = &lines[1..];
    let limit = limit.min(data_lines.len());

    let mut rows = Vec::new();
    for line in data_lines.iter().take(limit) {
        let values: Vec<&str> = line.split(',').map(|s| s.trim().trim_matches('"')).collect();
        let mut map = serde_json::Map::new();
        for (j, col_idx) in col_indices.iter().enumerate() {
            let col_name = &cols[j];
            let val = values.get(*col_idx).map(|s| s.to_string()).unwrap_or_default();
            map.insert(col_name.clone(), json!(val));
        }
        rows.push(Value::Object(map));
    }

    let mut dtypes = serde_json::Map::new();
    for col in &cols {
        dtypes.insert(col.clone(), json!("String"));
    }

    Ok((rows, cols, dtypes))
}
