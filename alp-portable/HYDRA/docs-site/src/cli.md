# CLI Reference

The HYDRA CLI (`hydra-cli`) provides command-line access to model management and creative generation.

## Installation

```bash
cd alp-portable/HYDRA
cargo build --release -p hydra-cli
```

## Commands

### hydra model list

List all discovered local models.

```bash
cargo run -p hydra-cli -- model list
```

**Output:**
```
Discovered models:
  - llama-2-7b (llama.cpp) [unloaded]
  - stable-diffusion (safetensors) [unloaded]
```

### hydra model run &lt;prompt&gt;

Run inference on a local model.

```bash
cargo run -p hydra-cli -- model run "Hello, world!"
```

If no local models are found, a fallback model is used.

### hydra creative run &lt;goal&gt;

Generate artifacts from a creative goal using the multimodal pipeline.

```bash
cargo run -p hydra-cli -- creative run "Create a logo for my startup"
```

**Output:**
```
Goal: Create a logo for my startup
Summary:
[planned] Understand the creative goal: Create a logo for my startup
[planned] Inferred modalities: [Image]
[generated] Generate images for: Create a logo for my startup via image-model (image: /path/to/logo.png)
Artifacts:
  - Image: /path/to/logo.png
```

## Global Options

- `--help` — Print help information
- `--version` — Print version information
