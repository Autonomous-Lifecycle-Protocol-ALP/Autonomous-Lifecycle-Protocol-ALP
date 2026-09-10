use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelSpec {
    pub id: String,
    pub backend: String,
    pub path: Option<String>,
    pub size_mb: u64,
    pub quantization: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationRequest {
    pub model_id: String,
    pub prompt: String,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub context: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationResponse {
    pub text: String,
    pub tokens_used: u32,
    pub latency_ms: u64,
    pub model_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackendCapabilities {
    pub supports_streaming: bool,
    pub supports_chat: bool,
    pub max_context_tokens: u32,
    pub supported_quantizations: Vec<String>,
}

pub trait InferenceBackend: Send + Sync {
    fn name(&self) -> &str;
    fn load_model(&self, spec: ModelSpec) -> Result<(), String>;
    fn unload_model(&self, model_id: &str) -> Result<(), String>;
    fn generate(&self, request: GenerationRequest) -> Result<GenerationResponse, String>;
    fn capabilities(&self) -> BackendCapabilities;
}

#[derive(Default)]
pub struct StubBackend {
    loaded_models: Mutex<std::collections::HashMap<String, ModelSpec>>,
}

impl StubBackend {
    pub fn new() -> Self {
        Self { loaded_models: Mutex::new(std::collections::HashMap::new()) }
    }
}

impl InferenceBackend for StubBackend {
    fn name(&self) -> &str {
        "stub"
    }

    fn load_model(&self, spec: ModelSpec) -> Result<(), String> {
        let path = spec.path.clone().ok_or_else(|| "model path required".to_string())?;
        if !std::path::Path::new(&path).exists() {
            return Err(format!("model file not found: {}", path));
        }
        self.loaded_models.lock().unwrap().insert(spec.id.clone(), spec);
        Ok(())
    }

    fn unload_model(&self, model_id: &str) -> Result<(), String> {
        self.loaded_models.lock().unwrap().remove(model_id)
            .ok_or_else(|| format!("model {} not loaded", model_id))?;
        Ok(())
    }

    fn generate(&self, request: GenerationRequest) -> Result<GenerationResponse, String> {
        let loaded = self.loaded_models.lock().unwrap();
        if !loaded.contains_key(&request.model_id) {
            return Err(format!("model {} not loaded", request.model_id));
        }
        drop(loaded);
        let tokens = request.prompt.split_whitespace().count() as u32 + 32;
        Ok(GenerationResponse {
            text: format!("[stub:{}] {}", request.model_id, request.prompt),
            tokens_used: tokens,
            latency_ms: 150,
            model_id: request.model_id,
        })
    }

    fn capabilities(&self) -> BackendCapabilities {
        BackendCapabilities {
            supports_streaming: true,
            supports_chat: true,
            max_context_tokens: 8192,
            supported_quantizations: vec!["Q4_K_M".into(), "Q5_K_M".into(), "Q8_0".into()],
        }
    }
}

#[cfg(feature = "real-llama")]
pub use self::real::LlamaCppBackend;

#[cfg(feature = "real-llama")]
mod real {
    use super::*;
    use llama_cpp_2::{
        LLamaCpp, LLamaCppModelParams, GenerateParams, GenerateResponse,
    };

    pub struct LlamaCppBackend {
        models: Mutex<std::collections::HashMap<String, LLamaCpp>>,
    }

    impl LlamaCppBackend {
        pub fn new() -> Self {
            Self { models: Mutex::new(std::collections::HashMap::new()) }
        }
    }

    impl Default for LlamaCppBackend {
        fn default() -> Self {
            Self::new()
        }
    }

    impl InferenceBackend for LlamaCppBackend {
        fn name(&self) -> &str {
            "llama.cpp"
        }

        fn load_model(&self, spec: ModelSpec) -> Result<(), String> {
            let path = spec.path.clone().ok_or_else(|| "model path required".to_string())?;
            if !std::path::Path::new(&path).exists() {
                return Err(format!("model file not found: {}", path));
            }
            let params = LLamaCppModelParams::default();
            let model = LLamaCpp::load_from_file(&path, params)
                .map_err(|e| format!("failed to load model {}: {}", path, e))?;
            self.models.lock().unwrap().insert(spec.id.clone(), model);
            Ok(())
        }

        fn unload_model(&self, model_id: &str) -> Result<(), String> {
            self.models.lock().unwrap().remove(model_id)
                .ok_or_else(|| format!("model {} not loaded", model_id))?;
            Ok(())
        }

        fn generate(&self, request: GenerationRequest) -> Result<GenerationResponse, String> {
            let mut models = self.models.lock().unwrap();
            let model = models.get_mut(&request.model_id)
                .ok_or_else(|| format!("model {} not loaded", request.model_id))?;

            let mut params = GenerateParams::default();
            params.max_tokens = request.max_tokens.unwrap_or(128) as usize;
            params.temperature = request.temperature.unwrap_or(0.7);

            let response: GenerateResponse = model.generate(&request.prompt, &params)
                .map_err(|e| format!("generation failed for {}: {}", request.model_id, e))?;

            Ok(GenerationResponse {
                text: response.text,
                tokens_used: response.tokens_used as u32,
                latency_ms: response.latency_ms,
                model_id: request.model_id,
            })
        }

        fn capabilities(&self) -> BackendCapabilities {
            BackendCapabilities {
                supports_streaming: true,
                supports_chat: true,
                max_context_tokens: 8192,
                supported_quantizations: vec!["Q4_K_M".into(), "Q5_K_M".into(), "Q8_0".into()],
            }
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[test]
        #[ignore = "requires real GGUF model and llama-cpp-2 feature"]
        fn llama_cpp_backend_load_and_generate() {
            let dir = std::env::temp_dir().join("hydra-test");
            let _ = std::fs::create_dir_all(&dir);
            let model_path = dir.join("test.gguf");
            let _ = std::fs::write(&model_path, b"fake");

            let backend = LlamaCppBackend::new();
            backend.load_model(ModelSpec {
                id: "test".into(),
                backend: "llama.cpp".into(),
                path: Some(model_path.to_string_lossy().into_owned()),
                size_mb: 100,
                quantization: Some("Q4_K_M".into()),
            }).unwrap();

            let resp = backend.generate(GenerationRequest {
                model_id: "test".into(),
                prompt: "Hello".into(),
                max_tokens: Some(64),
                temperature: Some(0.7),
                context: vec![],
            }).unwrap();

            assert_eq!(resp.model_id, "test");
            assert!(resp.text.len() > 0);
            assert!(resp.tokens_used > 0);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stub_backend_load_and_generate() {
        let dir = std::env::temp_dir().join("hydra-test");
        let _ = std::fs::create_dir_all(&dir);
        let model_path = dir.join("test.gguf");
        let _ = std::fs::write(&model_path, b"fake");

        let backend = StubBackend::new();
        backend.load_model(ModelSpec {
            id: "test".into(),
            backend: "stub".into(),
            path: Some(model_path.to_string_lossy().into_owned()),
            size_mb: 100,
            quantization: Some("Q4_K_M".into()),
        }).unwrap();

        let resp = backend.generate(GenerationRequest {
            model_id: "test".into(),
            prompt: "Hello".into(),
            max_tokens: Some(64),
            temperature: Some(0.7),
            context: vec![],
        }).unwrap();

        assert_eq!(resp.model_id, "test");
        assert!(resp.text.contains("Hello"));
        assert!(resp.tokens_used > 0);
    }

    #[test]
    fn stub_backend_rejects_missing_model() {
        let backend = StubBackend::new();
        let err = backend.generate(GenerationRequest {
            model_id: "missing".into(),
            prompt: "hi".into(),
            max_tokens: None,
            temperature: None,
            context: vec![],
        }).unwrap_err();
        assert!(err.contains("not loaded"));
    }

    #[test]
    fn stub_backend_rejects_missing_path() {
        let backend = StubBackend::new();
        let err = backend.load_model(ModelSpec {
            id: "missing".into(),
            backend: "stub".into(),
            path: None,
            size_mb: 0,
            quantization: None,
        }).unwrap_err();
        assert!(err.contains("model path required"));
    }
}
