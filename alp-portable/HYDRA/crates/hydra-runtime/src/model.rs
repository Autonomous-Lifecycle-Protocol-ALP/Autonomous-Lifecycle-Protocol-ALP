use std::path::PathBuf;
use std::sync::Arc;

use hydra_inference::{GenerationRequest as BackendGenerationRequest, InferenceBackend, ModelSpec};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Modality {
    Text,
    Image,
    Video,
    Model3D,
    Audio,
    Code,
}

#[derive(Debug, Clone)]
pub enum GenerationOutput {
    Text(String),
    Image(PathBuf),
    Video(PathBuf),
    Model3D(PathBuf),
    Audio(PathBuf),
    Code(PathBuf),
}

impl std::fmt::Display for GenerationOutput {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            GenerationOutput::Text(s) => write!(f, "{s}"),
            GenerationOutput::Image(p) => write!(f, "{}", p.display()),
            GenerationOutput::Video(p) => write!(f, "{}", p.display()),
            GenerationOutput::Model3D(p) => write!(f, "{}", p.display()),
            GenerationOutput::Audio(p) => write!(f, "{}", p.display()),
            GenerationOutput::Code(p) => write!(f, "{}", p.display()),
        }
    }
}

#[derive(Debug, Clone)]
pub struct GenerationRequest {
    pub prompt: String,
    pub modality: Modality,
    pub context_tokens: usize,
    pub resource_budget: ResourceBudget,
}

#[derive(Debug, Clone)]
pub struct GenerationResult {
    pub output: GenerationOutput,
    pub latency_ms: u64,
    pub tokens_used: usize,
}

#[derive(Debug, Clone)]
pub struct ResourceBudget {
    pub max_ram_mb: u64,
    pub max_cpu_percent: u8,
    pub timeout_seconds: u64,
}

pub trait Model {
    fn name(&self) -> &str;
    fn modality(&self) -> Modality;
    fn infer(&self, request: &GenerationRequest) -> GenerationResult;
}

#[derive(Clone)]
pub struct ModelAdapter {
    pub name: String,
    pub backend: String,
    pub loaded: bool,
    pub path: Option<PathBuf>,
    pub modality: Modality,
    pub inference_backend: Option<Arc<dyn InferenceBackend + Send + Sync>>,
}

impl ModelAdapter {
    pub fn new(
        name: impl Into<String>,
        backend: impl Into<String>,
        path: Option<PathBuf>,
        modality: Modality,
    ) -> Self {
        Self {
            name: name.into(),
            backend: backend.into(),
            loaded: false,
            path,
            modality,
            inference_backend: None,
        }
    }

    pub fn with_backend(
        mut self,
        backend: Arc<dyn InferenceBackend + Send + Sync>,
    ) -> Self {
        self.inference_backend = Some(backend);
        self
    }

    pub fn load(&mut self) -> Result<(), String> {
        if let Some(path) = &self.path {
            if !path.exists() {
                return Err(format!("model path not found: {}", path.display()));
            }
        }
        if let Some(backend) = &self.inference_backend {
            let spec = ModelSpec {
                id: self.name.clone(),
                backend: self.backend.clone(),
                path: self
                    .path
                    .as_ref()
                    .map(|p| p.to_string_lossy().into_owned()),
                size_mb: 0,
                quantization: None,
            };
            backend.load_model(spec)?;
        }
        self.loaded = true;
        Ok(())
    }
}

impl Model for ModelAdapter {
    fn name(&self) -> &str {
        &self.name
    }

    fn modality(&self) -> Modality {
        self.modality
    }

    fn infer(&self, request: &GenerationRequest) -> GenerationResult {
        if !self.loaded {
            return GenerationResult {
                output: GenerationOutput::Text(format!("[error] model {} not loaded", self.name)),
                latency_ms: 0,
                tokens_used: 0,
            };
        }
        if let Some(backend) = &self.inference_backend {
            let backend_req = BackendGenerationRequest {
                model_id: self.name.clone(),
                prompt: request.prompt.clone(),
                max_tokens: None,
                temperature: None,
                context: vec![],
            };
            match backend.generate(backend_req) {
                Ok(resp) => GenerationResult {
                    output: GenerationOutput::Text(resp.text),
                    latency_ms: resp.latency_ms,
                    tokens_used: resp.tokens_used as usize,
                },
                Err(err) => GenerationResult {
                    output: GenerationOutput::Text(format!("[error] {}: {err}", self.name)),
                    latency_ms: 0,
                    tokens_used: 0,
                },
            }
        } else {
            GenerationResult {
                output: GenerationOutput::Text(format!("[local:{}] {}", self.name, request.prompt)),
                latency_ms: 1,
                tokens_used: request.prompt.len(),
            }
        }
    }
}

pub fn scan_model_dir(dir: impl Into<PathBuf>) -> Vec<ModelAdapter> {
    let dir = dir.into();
    let mut out = Vec::new();
    if !dir.exists() {
        return out;
    }
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                    let modality = match path.extension().and_then(|s| s.to_str()) {
                        Some("gguf") => Some(Modality::Text),
                        Some("safetensors") | Some("ckpt") => Some(Modality::Image),
                        Some("glb") | Some("obj") => Some(Modality::Model3D),
                        _ => None,
                    };
                    if let Some(modality) = modality {
                        out.push(ModelAdapter::new(name, "local-file", Some(path.clone()), modality));
                    }
                }
            }
        }
    }
    out
}
