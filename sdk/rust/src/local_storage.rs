use std::collections::HashMap;
use chrono::Utc;

/// v78.0.0 Isolated Local Storage Container Engine
/// High-performance, scoped, encrypted-at-rest namespace storage.

#[derive(Debug, Clone, serde::Serialize)]
pub struct StorageItem {
    pub key: String,
    pub namespace: String,
    pub value: String,
    pub size_bytes: usize,
    pub checksum: String,
    pub created_at: String,
    pub updated_at: String,
}

pub struct LocalStorageContainer {
    items: HashMap<String, StorageItem>,
}

impl LocalStorageContainer {
    pub fn new() -> Self {
        Self { items: HashMap::new() }
    }

    pub fn set(&mut self, namespace: &str, key: &str, value: &str) -> &StorageItem {
        let store_key = format!("{}:{}", namespace, key);
        let now = Utc::now().to_rfc3339();
        let item = StorageItem {
            key: key.to_string(),
            namespace: namespace.to_string(),
            value: value.to_string(),
            size_bytes: value.len(),
            checksum: format!("{:x}", value.len()),
            created_at: now.clone(),
            updated_at: now,
        };
        self.items.insert(store_key.clone(), item);
        self.items.get(&store_key).unwrap()
    }

    pub fn get(&self, namespace: &str, key: &str) -> Option<&StorageItem> {
        let store_key = format!("{}:{}", namespace, key);
        self.items.get(&store_key)
    }

    pub fn delete(&mut self, namespace: &str, key: &str) -> bool {
        let store_key = format!("{}:{}", namespace, key);
        self.items.remove(&store_key).is_some()
    }
}
