pub mod model;
pub mod router;
pub mod selector;

pub use model::{GenerationOutput, GenerationRequest, GenerationResult, Modality, Model, ModelAdapter, ResourceBudget};
pub use router::ModelRouter;
pub use selector::{select_model, ModelManager};
pub use model::scan_model_dir;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::scan_model_dir;
    use hydra_inference::{
        BackendCapabilities, GenerationRequest as BackendGenerationRequest,
        GenerationResponse as BackendGenerationResponse, InferenceBackend, ModelSpec,
    };

    struct MockBackend {}

    impl InferenceBackend for MockBackend {
        fn name(&self) -> &str {
            "mock"
        }

        fn load_model(&self, _: ModelSpec) -> Result<(), String> {
            Ok(())
        }

        fn unload_model(&self, _: &str) -> Result<(), String> {
            Ok(())
        }

        fn generate(&self, req: BackendGenerationRequest) -> Result<BackendGenerationResponse, String> {
            Ok(BackendGenerationResponse {
                text: format!("[mock] {}", req.prompt),
                tokens_used: req.prompt.len() as u32,
                latency_ms: 5,
                model_id: req.model_id,
            })
        }

        fn capabilities(&self) -> BackendCapabilities {
            BackendCapabilities {
                supports_streaming: false,
                supports_chat: false,
                max_context_tokens: 4096,
                supported_quantizations: vec![],
            }
        }
    }

    #[test]
    fn model_adapter_infer_when_not_loaded() {
        let adapter = ModelAdapter::new("test", "backend", None, Modality::Text);
        let req = crate::GenerationRequest {
            prompt: "hello".into(),
            modality: Modality::Text,
            context_tokens: 0,
            resource_budget: ResourceBudget { max_ram_mb: 4096, max_cpu_percent: 80, timeout_seconds: 60 },
        };
        let result = adapter.infer(&req);
        match result.output {
            GenerationOutput::Text(msg) => assert!(msg.contains("not loaded")),
            _ => panic!("expected text output"),
        }
    }

    #[test]
    fn model_adapter_infer_dispatches_to_backend() {
        let backend = std::sync::Arc::new(MockBackend {}) as std::sync::Arc<dyn InferenceBackend + Send + Sync>;
        let mut adapter = ModelAdapter::new("test-model", "mock", None, Modality::Text)
            .with_backend(backend);
        adapter.load().unwrap();

        let req = crate::GenerationRequest {
            prompt: "hello".into(),
            modality: Modality::Text,
            context_tokens: 0,
            resource_budget: ResourceBudget { max_ram_mb: 4096, max_cpu_percent: 80, timeout_seconds: 60 },
        };
        let result = adapter.infer(&req);
        match result.output {
            GenerationOutput::Text(msg) => assert_eq!(msg, "[mock] hello"),
            _ => panic!("expected text output"),
        }
    }

    #[test]
    fn scan_model_dir_empty_dir() {
        let adapters = scan_model_dir("/nonexistent/path");
        assert!(adapters.is_empty());
    }

    #[test]
    fn select_model_by_ram() {
        let tiny = select_model(2048);
        assert_eq!(tiny.name, "tiny-cpu");

        let small = select_model(4096);
        assert_eq!(small.name, "small-cpu");

        let medium = select_model(16384);
        assert_eq!(medium.name, "medium-cpu");
    }
}
