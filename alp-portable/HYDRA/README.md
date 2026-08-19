# HYDRA Portable

**Built in India. Open to the world.**

HYDRA is an open-source autonomous personal AI designed to run on CPU-only computers from a portable 64 GB drive. Offline-first, private, and extensible.

## Architecture

- **Primary runtime:** Rust workspace — `Cargo.toml` at project root
- **AI/ML boundary:** Python package under `python/hydra/`
- **Protocol:** gRPC + protobuf (`protobuf/hydra.proto`)
- **UI:** Tauri desktop + React web UI (`apps/hydra-ui/`)
- **Config:** TOML profiles in `config/`
- **CLI:** Rust binary in `apps/hydra-cli/`
- **Daemon:** Rust binary in `apps/hydra-daemon/`

## Multimodal Generation

HYDRA supports multimodal generation through a unified creative pipeline. The system can generate:

- **Text** — LLM-based text generation
- **Images** — Image generation from text prompts
- **Video** — Video generation from text prompts
- **3D Models** — 3D model generation (`.glb`, `.obj`)
- **Audio** — Audio generation from text prompts
- **Code** — Code generation from text prompts

### Creative Pipeline

The `CreativePipeline` (`hydra-orchestrator`) infers modalities from goal keywords and routes generation requests to appropriate local models:

```rust
use hydra_orchestrator::CreativePipeline;
use hydra_runtime::{ModelManager, ResourceBudget};

let manager = ModelManager::new();
let budget = ResourceBudget { max_ram_mb: 4096, max_cpu_percent: 80, timeout_seconds: 60 };
let pipeline = CreativePipeline::new(manager, budget);
let result = pipeline.run("Create a logo and a website");
println!("{}", result.summary);
for artifact in result.artifacts {
    println!("{}: {}", artifact.modality, artifact.path);
}
```

### Daemon HTTP API

Start the daemon and use the `/creative` endpoint:

```bash
cargo run -p hydra-daemon
```

```bash
curl -X POST http://localhost:3000/creative \
  -H "Content-Type: application/json" \
  -d '{"goal": "Create a 3D model of a car"}'
```

Response:
```json
{
  "goal": "Create a 3D model of a car",
  "result": "[planned] Understand the creative goal: ...\n[generated] Generate 3D model for: ...",
  "artifacts": [
    {"modality": "Model3D", "path": "/path/to/model.glb"}
  ]
}
```

### CLI Creative Command

```bash
cargo run -p hydra-cli -- creative run "Create a logo for my startup"
```

## Directory Structure

```text
alp-portable/HYDRA/
├── Cargo.toml              # Rust workspace root
├── Cargo.lock              # Workspace lock file
├── pyproject.toml          # Python package config
├── prd.md                  # Product Requirements Document
├── tds.md                  # Technical Design Specification
├── README.md               # This file
│
├── crates/                 # Rust workspace crates
│   ├── hydra-core/         # Core types and interfaces
│   ├── hydra-runtime/      # Model runtime, routing, selection
│   ├── hydra-orchestrator/ # Creative pipeline, task orchestration
│   ├── hydra-scheduler/    # Task scheduling and dispatch
│   ├── hydra-daemon/       # HTTP daemon with /creative endpoint
│   └── ...                 # Additional crates
│
├── python/                 # AI/ML Python package
│   └── hydra/
│       ├── __init__.py
│       ├── inference.py    # Local model adapter with generate()
│       ├── skills.py       # Skill registry SDK
│       └── tools.py        # Tool implementations
│
├── protobuf/               # gRPC protocol definitions
│   └── hydra.proto
│
├── config/                 # TOML configuration profiles
├── examples/               # Example workflows and agents
├── docs/                   # Internal documentation
├── tests/                  # Integration test suite
└── apps/                   # Application binaries
    ├── hydra-cli/          # CLI client with creative commands
    ├── hydra-daemon/       # Background daemon with HTTP API
    └── hydra-ui/           # Tauri + React UI
```

## Quick Start

### Python (AI/ML boundary)

```bash
cd alp-portable/HYDRA
pip install -e .
python -m hydra --help
python -m hydra infer
python -m pytest tests/ -v
```

### Rust (core runtime)

```bash
cd alp-portable/HYDRA
cargo build --workspace
```

Run the daemon:

```bash
cargo run -p hydra-daemon
```

### CLI

```bash
cargo run -p hydra-cli -- --help
cargo run -p hydra-cli -- model list
cargo run -p hydra-cli -- creative run "Create a logo"
```

### Running tests

```bash
# All Python tests
python -m pytest tests/ -v

# All Rust tests (requires ~10 GB free disk space)
cargo test --workspace

# Individual packages (lower disk requirement)
cargo test -p hydra-runtime -p hydra-orchestrator -p hydra-scheduler -p hydra-daemon -p hydra-cli

# With coverage
cargo tarpaulin --workspace --out html
```

## Documentation

See `docs/` for architecture, API reference, and contribution guides.

## License

MIT
