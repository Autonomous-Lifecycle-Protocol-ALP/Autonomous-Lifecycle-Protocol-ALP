# HYDRA Portable — Python Package

**Built in India. Open to the world.**

This is the Python AI/ML boundary for HYDRA Portable. It provides local model adapters, skill registries, and tool implementations.

## Features

- CPU-first local inference
- Offline-first operation
- Multimodal generation (text, image, video, 3D, audio, code)
- Local model adapter with `generate()` method
- Skill registry SDK
- Tool implementations (filesystem, terminal, git, browser)

## Quick Start

```bash
cd HYDRA
pip install -e .
python -m hydra --help
python -m hydra infer
```

## Package Structure

```
hydra/
├── __init__.py        # Package entrypoint
├── __main__.py        # python -m hydra CLI
├── inference.py       # Local model adapter with generate()
├── skills.py          # Skill registry SDK
└── tools.py           # Tool implementations
```

## Documentation

See `docs/` for architecture, API reference, and contribution guides.

## License

MIT
