use crate::model::{scan_model_dir, GenerationRequest, ModelAdapter, Modality, ResourceBudget};
use crate::router::ModelRouter;

pub struct ModelManager {
    pub router: ModelRouter,
}

impl ModelManager {
    pub fn new() -> Self {
        Self { router: ModelRouter::new() }
    }

    pub fn register(&mut self, adapter: ModelAdapter) {
        self.router.register(Box::new(adapter));
    }

    pub fn discover(&mut self, model_dir: impl Into<std::path::PathBuf>) -> Vec<ModelAdapter> {
        let adapters = scan_model_dir(model_dir);
        for adapter in &adapters {
            self.register(adapter.clone());
        }
        adapters
    }

    pub fn select_for(&self, modality: Modality, available_ram_mb: u64) -> Option<&(dyn crate::model::Model + Send + Sync)> {
        let request = GenerationRequest {
            prompt: String::new(),
            modality,
            context_tokens: 0,
            resource_budget: ResourceBudget { max_ram_mb: available_ram_mb, max_cpu_percent: 80, timeout_seconds: 60 },
        };
        self.router.route(&request)
    }

    pub fn get_model(&self, name: &str) -> Option<&(dyn crate::model::Model + Send + Sync)> {
        self.router.get(name)
    }
}

pub fn select_model(available_ram_mb: u64) -> ModelAdapter {
    if available_ram_mb < 4096 {
        ModelAdapter::new("tiny-cpu", "llama.cpp", None, Modality::Text)
    } else if available_ram_mb < 8192 {
        ModelAdapter::new("small-cpu", "llama.cpp", None, Modality::Text)
    } else {
        ModelAdapter::new("medium-cpu", "llama.cpp", None, Modality::Text)
    }
}
