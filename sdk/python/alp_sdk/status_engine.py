from __future__ import annotations

import os
from typing import Dict, List, Optional


class StatusCounts:
    """Status counts for a specific object type."""

    def __init__(self, total: int = 0, todo: int = 0, in_progress: int = 0, done: int = 0, blocked: int = 0):
        self.total = total
        self.todo = todo
        self.in_progress = in_progress
        self.done = done
        self.blocked = blocked

    def to_dict(self) -> Dict[str, any]:
        return {
            "total": self.total,
            "todo": self.todo,
            "in_progress": self.in_progress,
            "done": self.done,
            "blocked": self.blocked,
        }


class StatusResult:
    """Result of a status operation."""

    def __init__(self, stats: Dict[str, StatusCounts]):
        self.stats = stats

    def to_dict(self) -> Dict[str, any]:
        return {
            key: value.to_dict() for key, value in self.stats.items()
        }


class StatusEngine:
    """Show project state and progress."""

    def get_status(self, dirpath: str) -> StatusResult:
        stats: Dict[str, StatusCounts] = {
            "project": StatusCounts(),
            "feature": StatusCounts(),
            "task": StatusCounts(),
            "workflow": StatusCounts(),
        }
        for root, _, files in os.walk(dirpath):
            for filename in files:
                if not filename.endswith(".alp"):
                    continue
                full_path = os.path.join(root, filename)
                objects = self._parse_file(full_path)
                for obj in objects:
                    obj_type = obj.get("_type", "unknown")
                    if obj_type not in stats:
                        continue
                    status = obj.get("status", "[ ]")
                    stats[obj_type].total += 1
                    if status == "[ ]":
                        stats[obj_type].todo += 1
                    elif status == "[~]":
                        stats[obj_type].in_progress += 1
                    elif status == "[x]":
                        stats[obj_type].done += 1
                    elif status == "[!]":
                        stats[obj_type].blocked += 1
        return StatusResult(stats=stats)

    def _parse_file(self, filepath: str) -> List[Dict[str, any]]:
        objects: List[Dict[str, any]] = []
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        lines = content.split("\n")
        current: Dict[str, any] = {}
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            type_match = __import__('re').match(r'^@(\w+)', stripped)
            if type_match:
                if current:
                    objects.append(current)
                current = {"_type": type_match.group(1)}
                continue
            id_match = __import__('re').match(r'^id:\s*(\S+)', stripped)
            if id_match:
                current["id"] = id_match.group(1)
            status_match = __import__('re').match(r'^status:\s*(.+)', stripped)
            if status_match:
                current["status"] = status_match.group(1).strip()
        if current:
            objects.append(current)
        return objects
