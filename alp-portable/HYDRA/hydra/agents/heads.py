from __future__ import annotations

from typing import Any

from hydra.agents.head import BaseHead, AgentSpec


class PlannerHead(BaseHead):
    spec = AgentSpec(
        name="planner",
        description="Breaks goals into tasks",
        capabilities=["plan"],
    )

    def handle(self, task: dict[str, Any]) -> str:
        return f"[planner] plan for: {task.get('goal', '')}"


class DeveloperHead(BaseHead):
    spec = AgentSpec(
        name="developer",
        description="Writes and modifies code",
        capabilities=["project.read", "project.write"],
    )

    def handle(self, task: dict[str, Any]) -> str:
        return f"[developer] implementation plan for: {task.get('goal', '')}"


class QAHead(BaseHead):
    spec = AgentSpec(
        name="qa",
        description="Runs tests and validates behavior",
        capabilities=["terminal.execute"],
    )

    def handle(self, task: dict[str, Any]) -> str:
        return f"[qa] test plan for: {task.get('goal', '')}"


class ReviewerHead(BaseHead):
    spec = AgentSpec(
        name="reviewer",
        description="Reviews implementations",
        capabilities=["project.read"],
    )

    def handle(self, task: dict[str, Any]) -> str:
        return f"[reviewer] review notes for: {task.get('goal', '')}"
