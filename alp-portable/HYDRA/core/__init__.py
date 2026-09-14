from dataclasses import dataclass, field
from typing import Any, Protocol


@dataclass
class Task:
    id: str
    goal: str
    context: dict[str, Any] = field(default_factory=dict)
    budget: dict[str, Any] = field(default_factory=dict)


class TaskManager(Protocol):
    def submit(self, task: Task) -> str: ...
    def cancel(self, task_id: str) -> bool: ...
    def status(self, task_id: str) -> dict[str, Any]: ...


class Orchestrator:
    def __init__(self, task_manager: TaskManager) -> None:
        self._tasks = task_manager

    def run(self, goal: str) -> str:
        task = Task(id=self._new_id(), goal=goal)
        self._tasks.submit(task)
        return task.id

    def _new_id(self) -> str:
        import uuid
        return uuid.uuid4().hex[:8]
