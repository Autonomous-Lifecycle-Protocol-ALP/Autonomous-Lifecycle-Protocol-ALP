"""Python-side inference helpers for HYDRA."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any


class Modality(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    MODEL_3D = "3d"
    AUDIO = "audio"
    CODE = "code"


@dataclass
class ResourceBudget:
    max_ram_mb: int = 4096
    max_cpu_percent: int = 80
    timeout_seconds: int = 60


@dataclass
class GenerationRequest:
    prompt: str
    modality: Modality = Modality.TEXT
    context_tokens: int = 0
    resource_budget: ResourceBudget | None = None

    def __post_init__(self) -> None:
        if self.resource_budget is None:
            self.resource_budget = ResourceBudget()


@dataclass
class GenerationResult:
    output_path: Path | None = None
    output_text: str | None = None
    latency_ms: int = 0
    tokens_used: int = 0


@dataclass
class ModelCapabilities:
    max_context: int = 4096
    supports_tools: bool = False
    supports_vision: bool = False
    supports_streaming: bool = False
    quantization: str = "q4_k_m"
    modality: Modality = Modality.TEXT


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

    def generate(self, request: GenerationRequest) -> GenerationResult:
        if not self._loaded:
            raise RuntimeError(f"Model {self.name} is not loaded")

        if request.modality != self.capabilities.modality:
            return GenerationResult(
                output_text=f"[error] model {self.name} does not support modality {request.modality.value}",
                latency_ms=0,
                tokens_used=0,
            )

        if request.modality == Modality.TEXT:
            return GenerationResult(
                output_text=f"[local:{self.name}] {request.prompt}",
                latency_ms=1,
                tokens_used=len(request.prompt),
            )

        if request.modality in {Modality.IMAGE, Modality.VIDEO, Modality.MODEL_3D, Modality.AUDIO}:
            return GenerationResult(
                output_path=Path(self.model_path),
                latency_ms=1,
                tokens_used=len(request.prompt),
            )

        if request.modality == Modality.CODE:
            return GenerationResult(
                output_path=Path(self.model_path).with_suffix(".py"),
                latency_ms=1,
                tokens_used=len(request.prompt),
            )

        return GenerationResult(
            output_text=f"[local:{self.name}] unsupported modality {request.modality.value}",
            latency_ms=0,
            tokens_used=0,
        )
