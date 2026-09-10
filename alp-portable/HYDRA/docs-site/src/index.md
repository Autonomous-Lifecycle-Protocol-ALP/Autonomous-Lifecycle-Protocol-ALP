---
layout: home

hero:
  name: 'HYDRA Portable'
  text: 'CPU-first · Offline-first · Portable'
  tagline: 'An open-source autonomous personal AI that runs on ordinary computers from a 64 GB drive.'
  image:
    src: /hydra-logo.png
    alt: HYDRA Logo
  actions:
    - theme: brand
      text: Get Started
      link: '/guide/getting-started'
    - theme: alt
      text: View on GitHub
      link: 'https://github.com/'
      target: _blank

features:
  - title: Multimodal Generation
    details: Generate text, images, video, 3D models, audio, and code from a single creative goal.
  - title: CPU-First Inference
    details: Runs on CPU-only computers. No dedicated GPU required for core functionality.
  - title: Offline-First
    details: Operates primarily without cloud connectivity. Your data stays on your machine.
  - title: Portable
    details: Runs from a 64 GB USB drive. Carry your AI environment anywhere.
  - title: Secure
    details: Capability-based security, sandboxing, and policy enforcement keep you in control.
  - title: Extensible
    details: Plugin system for custom models, tools, skills, and agents.
---

## Quick Start

### Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Build HYDRA

```bash
cd alp-portable/HYDRA
cargo build --workspace
```

### Run the Daemon

```bash
cargo run -p hydra-daemon
```

### Generate Something

```bash
cargo run -p hydra-cli -- creative run "Create a logo for my startup"
```

## Documentation

- [Getting Started](/guide/getting-started)
- [Architecture](/guide/architecture)
- [Multimodal Generation](/guide/multimodal-generation)
- [Daemon HTTP API](/api/daemon)
- [CLI Reference](/cli)

## License

MIT
