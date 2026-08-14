from dataclasses import dataclass
from typing import Any


@dataclass
class AgentSpec:
    name: str
    description: str
    capabilities: list[str]
    required_model: str | None = None
    input_schema: dict[str, Any] | None = None
    output_schema: dict[str, Any] | None = None


class HeadRegistry:
    def __init__(self) -> None:
        self._heads: dict[str, AgentSpec] = {}

    def register(self, spec: AgentSpec) -> None:
        self._heads[spec.name] = spec

    def get(self, name: str) -> AgentSpec | None:
        return self._heads.get(name)

    def list(self) -> list[str]:
        return list(self._heads.keys())
