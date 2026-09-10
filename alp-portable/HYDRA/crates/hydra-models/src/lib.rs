use std::sync::Arc;
use tokio::sync::RwLock;

pub struct ModelManager {
    pub models: Arc<RwLock<Vec<ModelInfo>>>,
}

#[derive(Debug, Clone)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub backend: String,
    pub size_mb: u64,
    pub loaded: bool,
}

impl ModelManager {
    pub fn new() -> Self {
        Self { models: Arc::new(RwLock::new(Vec::new())) }
    }

    pub async fn register(&self, info: ModelInfo) {
        self.models.write().await.push(info);
    }

    pub async fn list(&self) -> Vec<ModelInfo> {
        self.models.read().await.clone()
    }

    pub async fn get(&self, id: &str) -> Option<ModelInfo> {
        self.models.read().await.iter().find(|m| m.id == id).cloned()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn model_manager_register_and_list() {
        let mgr = ModelManager::new();
        mgr.register(ModelInfo { id: "m1".into(), name: "tiny".into(), backend: "llama".into(), size_mb: 100, loaded: false }).await;
        let list = mgr.list().await;
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].name, "tiny");
    }

    #[tokio::test]
    async fn model_manager_get_returns_none() {
        let mgr = ModelManager::new();
        assert!(mgr.get("missing").await.is_none());
    }
}
