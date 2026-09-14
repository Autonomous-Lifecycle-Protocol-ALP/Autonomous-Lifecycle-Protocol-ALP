# Multimodal Generation

HYDRA's multimodal generation system allows you to generate text, images, video, 3D models, audio, and code from a single creative goal. The system automatically infers which modalities are needed and routes generation requests to appropriate local models.

## Overview

```
Goal: "Create a logo and a website"
  │
  ▼
CreativePipeline::run()
  │
  ├── infer_modalities("Create a logo and a website")
  │     ├── Image (logo)
  │     └── Code (website)
  │
  ├── ModelManager::select_for(Image, ram)
  │     └── image-model (safetensors)
  │
  ├── ModelManager::select_for(Code, ram)
  │     └── code-model (gguf)
  │
  └── GenerationResult { goal, summary, artifacts }
```

## Modalities

| Modality | Description | File Extensions |
|----------|-------------|-----------------|
| `Text` | Text generation | `.gguf` |
| `Image` | Image generation | `.safetensors`, `.ckpt` |
| `Video` | Video generation | `.safetensors`, `.ckpt` |
| `Model3D` | 3D model generation | `.glb`, `.obj` |
| `Audio` | Audio generation | `.safetensors`, `.ckpt` |
| `Code` | Code generation | `.gguf` |

## Keyword Inference

The `infer_modalities` method scans the goal for keywords to determine which modalities to generate:

- **Image**: `image`, `picture`, `photo`, `logo`, `banner`
- **Video**: `video`, `animation`, `motion`
- **Model3D**: `3d`, `model`, `mesh`, `render`
- **Code**: `website`, `app`, `code`, `react`, `html`
- **Text**: fallback when no other modality matches

## Rust API

### CreativePipeline

```rust
use hydra_orchestrator::CreativePipeline;
use hydra_runtime::{ModelManager, ResourceBudget};

let manager = ModelManager::new();
let budget = ResourceBudget {
    max_ram_mb: 4096,
    max_cpu_percent: 80,
    timeout_seconds: 60,
};
let pipeline = CreativePipeline::new(manager, budget);

let result = pipeline.run("Create a logo");
println!("{}", result.summary);
for artifact in result.artifacts {
    println!("{}: {}", artifact.modality, artifact.path);
}
```

### GenerationRequest

```rust
use hydra_runtime::{GenerationRequest, Modality, ResourceBudget};

let request = GenerationRequest {
    prompt: "A futuristic city".to_string(),
    modality: Modality::Image,
    context_tokens: 0,
    resource_budget: ResourceBudget {
        max_ram_mb: 4096,
        max_cpu_percent: 80,
        timeout_seconds: 60,
    },
};
```

### Model Selection

```rust
use hydra_runtime::{ModelManager, Modality};

let manager = ModelManager::new();
let model = manager.select_for(Modality::Image, 4096);
```

## Python API

```python
from hydra.inference import LocalModelAdapter, GenerationRequest, Modality, ResourceBudget

adapter = LocalModelAdapter("image-model", "safetensors", None)
adapter.load()

request = GenerationRequest(
    prompt="A futuristic city",
    modality=Modality.IMAGE,
    context_tokens=0,
    resource_budget=ResourceBudget(max_ram_mb=4096, max_cpu_percent=80, timeout_seconds=60),
)

result = adapter.generate(request)
print(result.output)
```

## Daemon HTTP API

### POST /creative

Generate artifacts from a creative goal.

**Request:**
```json
{
  "goal": "Create a logo and a website"
}
```

**Response:**
```json
{
  "goal": "Create a logo and a website",
  "result": "[planned] Understand the creative goal: ...\n[generated] Generate images for: ...",
  "artifacts": [
    {"modality": "Image", "path": "/path/to/logo.png"},
    {"modality": "Code", "path": "/path/to/index.html"}
  ]
}
```

## Model Directory Scanning

The `scan_model_dir` function infers modality from file extensions:

- `.gguf` → `Text` or `Code`
- `.safetensors`, `.ckpt` → `Image`, `Video`, or `Audio`
- `.glb`, `.obj` → `Model3D`

Place model files in the configured `model_dir` and they will be automatically discovered with their inferred modality.
