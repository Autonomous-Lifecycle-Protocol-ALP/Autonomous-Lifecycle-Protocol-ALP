from __future__ import annotations

from typing import Any

from .local import LocalModelAdapter


class ModelRouter:
    def __init__(self) -> None:
        self._adapters: dict[str, LocalModelAdapter] = {}

    def register(self, adapter: LocalModelAdapter) -> None:
        self._adapters[adapter.name] = adapter

    def route(self, task: dict[str, Any]) -> LocalModelAdapter:
        if not self._adapters:
            raise RuntimeError("No model adapters registered")
        return next(iter(self._adapters.values()))
