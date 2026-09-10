# Getting Started

This guide will help you set up HYDRA Portable on your machine.

## Prerequisites

- **Rust** 1.70+ (install via [rustup](https://rustup.rs/))
- **Python** 3.10+ (for AI/ML boundary)
- **Git** (for cloning the repository)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/hydra-portable.git
cd hydra-portable/alp-portable/HYDRA
```

### 2. Build the Rust Workspace

```bash
cargo build --workspace
```

### 3. Install Python Dependencies

```bash
cd python
pip install -e .
```

## Python CLI

```bash
python -m hydra --help
python -m hydra infer
python -m hydra info
```

## Running the Daemon

The daemon provides an HTTP API for task submission and creative generation.

```bash
cargo run -p hydra-daemon
```

The daemon listens on `http://localhost:3000` by default.

## Using the CLI

```bash
# List available models
cargo run -p hydra-cli -- model list

# Run inference
cargo run -p hydra-cli -- model run "Hello, world!"

# Generate creative content
cargo run -p hydra-cli -- creative run "Create a logo"
```

## Next Steps

- [Architecture](/guide/architecture) — Learn about the system architecture
- [Multimodal Generation](/guide/multimodal-generation) — Generate images, video, 3D models, and code
- [Daemon HTTP API](/api/daemon) — Integrate with the daemon API
- [CLI Reference](/cli) — Complete CLI command reference
