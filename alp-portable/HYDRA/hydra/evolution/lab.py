from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class Experience:
    task_id: str
    trajectory: list[dict[str, Any]]
    outcome: str
    score: float = 0.0


class EvolutionLab:
    def __init__(self) -> None:
        self._experiences: list[Experience] = []

    def record(self, experience: Experience) -> None:
        self._experiences.append(experience)

    def generate_candidate_skill(self, experience: Experience) -> dict[str, Any]:
        return {"name": "candidate", "version": "0.1.0"}
