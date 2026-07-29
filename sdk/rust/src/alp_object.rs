use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlpObject {
    pub id: String,
    #[serde(rename = "type")]
    pub object_type: String,
    #[serde(flatten)]
    pub properties: HashMap<String, serde_json::Value>,
}

impl AlpObject {
    pub fn new(id: impl Into<String>, object_type: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            object_type: object_type.into(),
            properties: HashMap::new(),
        }
    }

    pub fn with_property(mut self, key: impl Into<String>, value: impl Into<serde_json::Value>) -> Self {
        self.properties.insert(key.into(), value.into());
        self
    }

    pub fn to_json(&self) -> Result<String, AlpError> {
        serde_json::to_string_pretty(self).map_err(AlpError::from)
    }
}
