use crate::model::{GenerationRequest, Model};
use std::collections::HashMap;

pub struct ModelRouter {
    pub adapters: HashMap<String, Box<dyn Model + Send + Sync>>,
}

impl ModelRouter {
    pub fn new() -> Self {
        Self { adapters: HashMap::new() }
    }

    pub fn register(&mut self, adapter: Box<dyn Model + Send + Sync>) {
        let name = adapter.name().to_string();
        self.adapters.insert(name, adapter);
    }

    pub fn route(&self, request: &GenerationRequest) -> Option<&(dyn Model + Send + Sync)> {
        self.adapters
            .values()
            .find(|m| m.modality() == request.modality)
            .or_else(|| self.adapters.values().next())
            .map(|m| m.as_ref())
    }

    pub fn get(&self, name: &str) -> Option<&(dyn Model + Send + Sync)> {
        self.adapters.get(name).map(|m| m.as_ref())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::{GenerationResult, GenerationOutput, Modality, ResourceBudget};

    struct FakeModel {
        name: &'static str,
        modality: Modality,
    }

    impl Model for FakeModel {
        fn name(&self) -> &str {
            self.name
        }
        fn modality(&self) -> Modality {
            self.modality
        }
        fn infer(&self, _request: &GenerationRequest) -> GenerationResult {
            GenerationResult {
                output: GenerationOutput::Text(format!("fake:{}", self.name)),
                latency_ms: 0,
                tokens_used: 0,
            }
        }
    }

    #[test]
    fn route_matches_modality() {
        let mut router = ModelRouter::new();
        router.register(Box::new(FakeModel { name: "text", modality: Modality::Text }));
        router.register(Box::new(FakeModel { name: "image", modality: Modality::Image }));

        let req = GenerationRequest {
            prompt: "a cat".into(),
            modality: Modality::Image,
            context_tokens: 0,
            resource_budget: ResourceBudget { max_ram_mb: 4096, max_cpu_percent: 80, timeout_seconds: 60 },
        };

        let selected = router.route(&req).unwrap();
        assert_eq!(selected.name(), "image");
    }

    #[test]
    fn route_falls_back_when_modality_missing() {
        let mut router = ModelRouter::new();
        router.register(Box::new(FakeModel { name: "text", modality: Modality::Text }));

        let req = GenerationRequest {
            prompt: "hello".into(),
            modality: Modality::Video,
            context_tokens: 0,
            resource_budget: ResourceBudget { max_ram_mb: 4096, max_cpu_percent: 80, timeout_seconds: 60 },
        };

        let selected = router.route(&req).unwrap();
        assert_eq!(selected.name(), "text");
    }
}
