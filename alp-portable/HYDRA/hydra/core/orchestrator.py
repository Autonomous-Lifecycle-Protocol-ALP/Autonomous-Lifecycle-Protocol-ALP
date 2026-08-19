from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any

from hydra.core.task_manager import Task, TaskManager
from hydra.runtime.router import ModelRouter


@dataclass
class Orchestrator:
    model: Any = field(default=None)
    hardware: Any = field(default=None)
    task_manager: TaskManager = field(default_factory=TaskManager)
    _router: ModelRouter = field(default_factory=ModelRouter)

    def __post_init__(self) -> None:
        if self.model is not None:
            self._router.register(self.model)

    def run_goal(self, goal: str, context: dict[str, Any] | None = None) -> str:
        task = Task(id=self._new_id(), goal=goal, context=context or {})
        task_id = self.task_manager.submit(task)
        try:
            adapter = self._router.route(task.context)
            result = adapter.infer(goal)
            self.task_manager.complete(task_id, result)
        except Exception as exc:
            task.status = "failed"
            task.result = str(exc)
        return task_id

    def _new_id(self) -> str:
        return uuid.uuid4().hex[:8]
