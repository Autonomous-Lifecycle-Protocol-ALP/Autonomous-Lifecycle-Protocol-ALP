use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct CredentialBroker {
    pub credentials: Arc<RwLock<HashMap<String, Credential>>>,
}

#[derive(Debug, Clone)]
pub struct Credential {
    pub id: String,
    pub service: String,
    pub username: Option<String>,
    pub token: Option<String>,
    pub expires_at: Option<String>,
}

impl CredentialBroker {
    pub fn new() -> Self {
        Self { credentials: Arc::new(RwLock::new(HashMap::new())) }
    }

    pub async fn store(&self, credential: Credential) {
        self.credentials.write().await.insert(credential.id.clone(), credential);
    }

    pub async fn get(&self, id: &str) -> Option<Credential> {
        self.credentials.read().await.get(id).cloned()
    }

    pub async fn remove(&self, id: &str) {
        self.credentials.write().await.remove(id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn credential_store_and_get() {
        let broker = CredentialBroker::new();
        let cred = Credential {
            id: "cred-1".into(),
            service: "github".into(),
            username: Some("user".into()),
            token: Some("token123".into()),
            expires_at: None,
        };
        broker.store(cred.clone()).await;
        let fetched = broker.get("cred-1").await;
        assert!(fetched.is_some());
        assert_eq!(fetched.unwrap().service, "github");
    }

    #[tokio::test]
    async fn credential_remove() {
        let broker = CredentialBroker::new();
        broker.store(Credential { id: "c1".into(), service: "svc".into(), username: None, token: None, expires_at: None }).await;
        broker.remove("c1").await;
        assert!(broker.get("c1").await.is_none());
    }
}
