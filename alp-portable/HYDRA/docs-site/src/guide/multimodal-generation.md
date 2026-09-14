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

## CreativePipeline API

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

## CLI Creative Command

```bash
cargo run -p hydra-cli -- creative run "Create a logo for my startup"
```
