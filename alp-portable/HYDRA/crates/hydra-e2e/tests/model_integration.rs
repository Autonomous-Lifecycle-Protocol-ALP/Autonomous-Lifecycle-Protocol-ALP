use hydra_runtime::{ModelManager, GenerationRequest, Modality, ResourceBudget, Model};
use hydra_e2e::support::TestEnv;

#[tokio::test]
async fn model_discovery_loads_gguf_text_model() {
    let env = TestEnv::new();
    let model_path = env.model_dir().join("tiny-text.gguf");
    std::fs::write(&model_path, b"fake-gguf").unwrap();

    let mut manager = ModelManager::new();
    let adapters = manager.discover(env.model_dir());
    assert!(!adapters.is_empty());
    let names: Vec<String> = adapters.iter().map(|a| a.name.clone()).collect();
    assert!(names.iter().any(|n| n == "tiny-text"));
}

#[tokio::test]
async fn model_discovery_loads_safetensors_image_model() {
    let env = TestEnv::new();
    let model_path = env.model_dir().join("small-image.safetensors");
    std::fs::write(&model_path, b"fake-safetensors").unwrap();

    let mut manager = ModelManager::new();
    let adapters = manager.discover(env.model_dir());
    assert!(!adapters.is_empty());
    let names: Vec<String> = adapters.iter().map(|a| a.name.clone()).collect();
    assert!(names.iter().any(|n| n == "small-image"));
}

#[tokio::test]
async fn loaded_model_adapter_generates_text() {
    let env = TestEnv::new();
    let model_path = env.model_dir().join("tiny-text.gguf");
    std::fs::write(&model_path, b"fake-gguf").unwrap();

    let mut manager = ModelManager::new();
    let adapters = manager.discover(env.model_dir());
    let mut adapter = adapters.into_iter().next().unwrap();
    adapter.load().unwrap();

    let req = GenerationRequest {
        prompt: "hello".into(),
        modality: Modality::Text,
        context_tokens: 0,
        resource_budget: ResourceBudget { max_ram_mb: 4096, max_cpu_percent: 80, timeout_seconds: 60 },
    };
    let result = adapter.infer(&req);
    let output_text = match result.output {
        hydra_runtime::GenerationOutput::Text(ref t) => t.clone(),
        other => panic!("expected text output, got: {:?}", other),
    };
    assert!(output_text.contains("hello") || output_text.contains("tiny-text"));
}

#[tokio::test]
async fn scan_model_dir_ignores_non_model_files() {
    let env = TestEnv::new();
    std::fs::write(env.model_dir().join("readme.txt"), b"not a model").unwrap();
    let adapters = hydra_runtime::scan_model_dir(env.model_dir());
    assert!(adapters.is_empty());
}
