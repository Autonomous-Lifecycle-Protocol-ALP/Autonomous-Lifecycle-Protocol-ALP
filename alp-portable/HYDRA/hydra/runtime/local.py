from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ModelCapabilities:
    max_context: int = 4096
    supports_tools: bool = False
    supports_vision: bool = False
    supports_streaming: bool = False
    quantization: str = "q4_k_m"


class LocalModelAdapter:
    def __init__(self, name: str, model_path: str, capabilities: ModelCapabilities | None = None) -> None:
        self.name = name
        self.model_path = model_path
        self.capabilities = capabilities or ModelCapabilities()
        self._loaded = False

    def load(self) -> None:
        self._loaded = True

    def unload(self) -> None:
        self._loaded = False

    def infer(self, prompt: str, **kwargs: Any) -> str:
        if not self._loaded:
            raise RuntimeError(f"Model {self.name} is not loaded")
        return f"[local:{self.name}] {prompt}"
