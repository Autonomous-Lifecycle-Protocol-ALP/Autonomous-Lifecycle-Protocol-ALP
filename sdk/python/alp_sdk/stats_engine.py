from __future__ import annotations

import os
from typing import Any, Dict, List, Optional


class FileStats:
    """Statistics for a single file."""

    def __init__(self, file: str, object_count: int):
        self.file = file
        self.object_count = object_count

    def to_dict(self) -> Dict[str, Any]:
        return {"file": self.file, "object_count": self.object_count}


class WorkspaceStats:
    """Aggregate workspace statistics."""

    def __init__(self):
        self.files = 0
        self.total_objects = 0
        self.type_counts: Dict[str, int] = {}
        self.file_stats: List[FileStats] = []

    def add_file(self, file: str, object_count: int, type_counts: Dict[str, int]) -> None:
        self.files += 1
        self.total_objects += object_count
        self.file_stats.append(FileStats(file=file, object_count=object_count))
        for type_name, count in type_counts.items():
            self.type_counts[type_name] = self.type_counts.get(type_name, 0) + count

    @property
    def top_types(self) -> List[tuple[str, int]]:
        return sorted(self.type_counts.items(), key=lambda item: item[1], reverse=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "files": self.files,
            "total_objects": self.total_objects,
            "type_counts": self.type_counts,
            "file_stats": [s.to_dict() for s in self.file_stats],
        }


class StatsEngine:
    """Compute workspace statistics from parsed ALP files."""

    def compute(self, workspace_path: str, parse_fn) -> WorkspaceStats:
        alp_dir = os.path.join(workspace_path, ".alp")
        if not os.path.isdir(alp_dir):
            raise FileNotFoundError(f".alp directory not found in {workspace_path}")

        stats = WorkspaceStats()
        files = [f for f in os.listdir(alp_dir) if f.endswith('.alp')]

        for filename in files:
            full_path = os.path.join(alp_dir, filename)
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()

            objects = parse_fn(content)
            type_counts: Dict[str, int] = {}
            for obj in objects:
                type_name = obj.get('_type') or obj.get('type') or 'unknown'
                type_counts[type_name] = type_counts.get(type_name, 0) + 1

            stats.add_file(file=filename, object_count=len(objects), type_counts=type_counts)

        return stats
