from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from queue import Queue


@dataclass
class Task:
    id: str
    goal: str
    context: dict[str, Any] = field(default_factory=dict)
    budget: dict[str, Any] = field(default_factory=dict)
    status: str = "pending"
    result: str | None = None


class TaskManager:
    def __init__(self) -> None:
        self._tasks: dict[str, Task] = {}
        self._queue: Queue[str] = Queue()

    def submit(self, task: Task) -> str:
        self._tasks[task.id] = task
        self._queue.put(task.id)
        task.status = "queued"
        return task.id

    def cancel(self, task_id: str) -> bool:
        if task_id in self._tasks:
            self._tasks[task_id].status = "cancelled"
            return True
        return False

    def status(self, task_id: str) -> dict[str, Any]:
        task = self._tasks.get(task_id)
        if not task:
            return {"error": "not_found"}
        return {
            "id": task.id,
            "goal": task.goal,
            "status": task.status,
            "result": task.result,
        }

    def next(self) -> str | None:
        if self._queue.empty():
            return None
        return self._queue.get_nowait()

    def complete(self, task_id: str, result: str) -> None:
        if task_id in self._tasks:
            self._tasks[task_id].status = "completed"
            self._tasks[task_id].result = result
