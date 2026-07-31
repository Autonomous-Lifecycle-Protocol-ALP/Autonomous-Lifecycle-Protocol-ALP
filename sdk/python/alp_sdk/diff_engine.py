from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional


class DiffEntry:
    """A single change entry in a workspace diff."""

    def __init__(self, obj_id: str, change_type: str, before: Optional[Dict[str, Any]] = None, after: Optional[Dict[str, Any]] = None):
        self.obj_id = obj_id
        self.change_type = change_type
        self.before = before
        self.after = after

    def to_dict(self) -> Dict[str, Any]:
        result: Dict[str, Any] = {"id": self.obj_id, "change_type": self.change_type}
        if self.before is not None:
            result["before"] = self.before
        if self.after is not None:
            result["after"] = self.after
        return result


class DiffResult:
    """Result of diffing two workspace states or snapshots."""

    def __init__(self, source_a: str, source_b: str):
        self.source_a = source_a
        self.source_b = source_b
        self.entries: List[DiffEntry] = []

    def add(self, entry: DiffEntry) -> None:
        self.entries.append(entry)

    @property
    def added(self) -> List[DiffEntry]:
        return [e for e in self.entries if e.change_type == "added"]

    @property
    def removed(self) -> List[DiffEntry]:
        return [e for e in self.entries if e.change_type == "removed"]

    @property
    def modified(self) -> List[DiffEntry]:
        return [e for e in self.entries if e.change_type == "modified"]

    @property
    def is_empty(self) -> bool:
        return not self.entries

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_a": self.source_a,
            "source_b": self.source_b,
            "added": [e.to_dict() for e in self.added],
            "removed": [e.to_dict() for e in self.removed],
            "modified": [e.to_dict() for e in self.modified],
        }

    def summary(self) -> str:
        return f"Diff {self.source_a} -> {self.source_b}: +{len(self.added)} -{len(self.removed)} ~{len(self.modified)}"


class DiffEngine:
    """Compute structural diffs between two workspace states or snapshot files."""

    def diff_objects(self, objects_a: List[Dict[str, Any]], objects_b: List[Dict[str, Any]], label_a: str = "a", label_b: str = "b") -> DiffResult:
        result = DiffResult(source_a=label_a, source_b=label_b)
        objs_a = {self._key(o): o for o in objects_a}
        objs_b = {self._key(o): o for o in objects_b}

        for obj_id in sorted(set(objs_b) - set(objs_a)):
            result.add(DiffEntry(obj_id=obj_id, change_type="added", after=objs_b[obj_id]))

        for obj_id in sorted(set(objs_a) - set(objs_b)):
            result.add(DiffEntry(obj_id=obj_id, change_type="removed", before=objs_a[obj_id]))

        for obj_id in sorted(set(objs_a) & set(objs_b)):
            if json.dumps(objs_a[obj_id], sort_keys=True) != json.dumps(objs_b[obj_id], sort_keys=True):
                result.add(DiffEntry(obj_id=obj_id, change_type="modified", before=objs_a[obj_id], after=objs_b[obj_id]))

        return result

    def diff_snapshots(self, workspace_path: str, name_a: str, name_b: str) -> DiffResult:
        snapshot_dir = os.path.join(workspace_path, ".alp", ".snapshots")
        path_a = os.path.join(snapshot_dir, f"{name_a}.json")
        path_b = os.path.join(snapshot_dir, f"{name_b}.json")

        if not os.path.exists(path_a):
            raise FileNotFoundError(f"Snapshot '{name_a}' not found in {workspace_path}")
        if not os.path.exists(path_b):
            raise FileNotFoundError(f"Snapshot '{name_b}' not found in {workspace_path}")

        with open(path_a, "r", encoding="utf-8") as f:
            payload_a = json.load(f)
        with open(path_b, "r", encoding="utf-8") as f:
            payload_b = json.load(f)

        return self.diff_objects(
            payload_a.get("objects", []),
            payload_b.get("objects", []),
            label_a=name_a,
            label_b=name_b,
        )

    @staticmethod
    def _key(obj: Dict[str, Any]) -> str:
        return obj.get("id") or obj.get("_type") or json.dumps(obj, sort_keys=True)
