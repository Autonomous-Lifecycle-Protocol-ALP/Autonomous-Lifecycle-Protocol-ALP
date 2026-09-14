from __future__ import annotations

from typing import Any

from hydra.agents.head import HeadRegistry
from hydra.agents.heads import DeveloperHead, PlannerHead, QAHead, ReviewerHead


class AgentManager:
    def __init__(self) -> None:
        self._registry = HeadRegistry()
        for head in [PlannerHead(), DeveloperHead(), QAHead(), ReviewerHead()]:
            self._registry.register(head.spec)

    def available(self) -> list[str]:
        return self._registry.list()

    def execute(self, name: str, task: dict[str, Any]) -> str:
        head_map = {
            "planner": PlannerHead,
            "developer": DeveloperHead,
            "qa": QAHead,
            "reviewer": ReviewerHead,
        }
        head_cls = head_map.get(name)
        if not head_cls:
            raise KeyError(f"Unknown head: {name}")
        return head_cls().handle(task)
