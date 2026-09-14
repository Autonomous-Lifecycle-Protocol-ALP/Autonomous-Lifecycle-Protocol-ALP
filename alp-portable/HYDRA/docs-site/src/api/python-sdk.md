# Python SDK

The Python AI/ML boundary provides local model adapters, skill registries, and tool implementations.

## LocalModelAdapter

```python
from hydra.inference import LocalModelAdapter

adapter = LocalModelAdapter("model-name", "backend", None)
adapter.load()
```

## GenerationRequest

```python
from hydra.inference import GenerationRequest, Modality, ResourceBudget

request = GenerationRequest(
    prompt="A futuristic city",
    modality=Modality.IMAGE,
    context_tokens=0,
    resource_budget=ResourceBudget(
        max_ram_mb=4096,
        max_cpu_percent=80,
        timeout_seconds=60
    ),
)
```

## GenerationResult

```python
result = adapter.generate(request)
print(result.output)  # Path to generated artifact
```

## Supported Modalities

| Modality | Description |
|----------|-------------|
| `TEXT` | Text generation |
| `IMAGE` | Image generation |
| `VIDEO` | Video generation |
| `MODEL3D` | 3D model generation |
| `AUDIO` | Audio generation |
| `CODE` | Code generation |
