from typing import Any


class ModelAdapter:
    def __init__(self, name: str, backend: str) -> None:
        self.name = name
        self.backend = backend

    def load(self) -> None:
        raise NotImplementedError

    def infer(self, prompt: str, **kwargs: Any) -> str:
        raise NotImplementedError


class ModelRouter:
    def __init__(self) -> None:
        self._adapters: dict[str, ModelAdapter] = {}

    def register(self, adapter: ModelAdapter) -> None:
        self._adapters[adapter.name] = adapter

    def route(self, task: dict[str, Any]) -> ModelAdapter:
        return list(self._adapters.values())[0]
