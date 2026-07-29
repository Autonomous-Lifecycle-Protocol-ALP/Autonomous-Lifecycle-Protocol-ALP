use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::Utc;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SealedSecret {
    pub id: String,
    pub recipients: Vec<String>,
    pub nonce: String,
    pub ciphertext: String,
    pub created_at: String,
    pub rotated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultAuditEntry {
    pub ts: String,
    pub action: String,
    pub id: String,
    pub by: String,
}

pub struct Vault {
    secrets: HashMap<String, SealedSecret>,
    audit: Vec<VaultAuditEntry>,
}

impl Vault {
    pub fn new() -> Self {
        Self {
            secrets: HashMap::new(),
            audit: Vec::new(),
        }
    }

    pub fn set_secret(&mut self, id: impl Into<String>, value: impl Into<String>, recipients: Vec<String>) {
        let secret = SealedSecret {
            id: id.into(),
            recipients,
            nonce: uuid::Uuid::new_v4().to_string(),
            ciphertext: value.into(),
            created_at: chrono::Utc::now().to_rfc3339(),
            rotated_at: None,
        };
        self.secrets.insert(secret.id.clone(), secret);
        self.audit.push(VaultAuditEntry {
            ts: chrono::Utc::now().to_rfc3339(),
            action: "set".into(),
            id: id.into(),
            by: "anonymous".into(),
        });
    }

    pub fn get_secret(&self, id: &str) -> Result<String, AlpError> {
        let secret = self.secrets.get(id).ok_or_else(|| AlpError::new(format!("Secret not found: {}", id)))?;
        self.audit.push(VaultAuditEntry {
            ts: chrono::Utc::now().to_rfc3339(),
            action: "get".into(),
            id: id.into(),
            by: "anonymous".into(),
        });
        Ok(secret.ciphertext.clone())
    }

    pub fn list_secrets(&self) -> Vec<String> {
        self.secrets.keys().cloned().collect()
    }

    pub fn audit(&self) -> Vec<VaultAuditEntry> {
        self.audit.clone()
    }
}
