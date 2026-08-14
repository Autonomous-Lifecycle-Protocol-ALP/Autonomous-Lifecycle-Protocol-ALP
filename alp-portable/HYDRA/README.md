# HYDRA Portable

**Built in India. Open to the world.**

HYDRA is an open-source autonomous personal AI designed to run on CPU-only computers from a portable 64 GB drive. Offline-first, private, and extensible.

## Features

- CPU-first local inference
- Offline-first operation
- Multi-agent orchestration
- Persistent project memory
- Capability-based security
- Dynamic sandbox creation
- Autonomous software engineering
- Self-correction and verification
- Benchmark-driven evolution

## Quick Start

```bash
cd HYDRA
pip install -e .
python -m hydra
```

## Project Structure

```
HYDRA/
├── core/           # Orchestrator, task manager, context engine
├── runtime/        # Model adapters, inference layer
├── security/       # Security kernel, capabilities, audit
├── agents/         # AI heads (planner, developer, QA, reviewer)
├── skills/         # Reusable capabilities
├── tools/          # Filesystem, terminal, git, browser
├── memory/         # Working, project, episodic, skill memory
├── sandbox/        # Dynamic sandbox creation and isolation
├── vision/         # Screen understanding, computer vision
├── voice/          # STT/TTS local pipelines
├── evolution/      # Experience-to-skill pipeline
├── benchmarks/     # Performance and capability benchmarks
├── ui/             # Desktop and web interfaces
├── docs/           # Documentation
├── examples/       # Usage examples
├── tests/          # Unit, integration, and security tests
└── sdk/            # Developer SDK for extensions
```

## Documentation

See `docs/` for architecture, API reference, and contribution guides.

## License

MIT
