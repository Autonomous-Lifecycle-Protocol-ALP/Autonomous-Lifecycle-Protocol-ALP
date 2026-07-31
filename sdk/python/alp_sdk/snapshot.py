from __future__ import annotations

import copy
import json
import os
import random
import string
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class WorkspaceSnapshot:
    """Metadata for a single workspace snapshot."""

    def __init__(
        self,
        name: str,
        description: str = "",
        object_count: int = 0,
        project_count: int = 0,
        created_at: Optional[str] = None,
    ):
        self.name = name
        self.description = description
        self.object_count = object_count
        self.project_count = project_count
        self.created_at = created_at or datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "object_count": self.object_count,
            "project_count": self.project_count,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "WorkspaceSnapshot":
        return cls(
            name=data["name"],
            description=data.get("description", ""),
            object_count=data.get("object_count", 0),
            project_count=data.get("project_count", 0),
            created_at=data.get("created_at"),
        )


class SnapshotDiff:
    """Result of diffing two snapshots."""

    def __init__(
        self,
        snapshot_a: str,
        snapshot_b: str,
        added: List[str],
        removed: List[str],
        modified: List[str],
    ):
        self.snapshot_a = snapshot_a
        self.snapshot_b = snapshot_b
        self.added = added
        self.removed = removed
        self.modified = modified

    @property
    def is_empty(self) -> bool:
        return not self.added and not self.removed and not self.modified

    def to_dict(self) -> Dict[str, Any]:
        return {
            "snapshot_a": self.snapshot_a,
            "snapshot_b": self.snapshot_b,
            "added": self.added,
            "removed": self.removed,
            "modified": self.modified,
        }


class SnapshotEngine:
    """Create, list, restore, diff, and delete workspace snapshots."""

    def __init__(self):
        self._snapshots: Dict[str, Dict[str, Any]] = {}

    def create(
        self,
        workspace_path: str,
        objects: List[Dict[str, Any]],
        projects: List[Dict[str, Any]],
        description: str = "",
    ) -> WorkspaceSnapshot:
        """Create a snapshot of the current workspace state.

        Args:
            workspace_path: Root path of the workspace.
            objects: Serialized ALP objects to snapshot.
            projects: Project metadata to snapshot.
            description: Human-readable description of the snapshot.

        Returns:
            The created WorkspaceSnapshot metadata.
        """
        snapshot_dir = self._snapshot_dir(workspace_path)
        os.makedirs(snapshot_dir, exist_ok=True)

        name = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=4))
        name = f"{name}-{suffix}"
        snapshot = WorkspaceSnapshot(
            name=name,
            description=description,
            object_count=len(objects),
            project_count=len(projects),
        )

        payload = {
            "metadata": snapshot.to_dict(),
            "objects": objects,
            "projects": projects,
        }

        path = os.path.join(snapshot_dir, f"{name}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        self._snapshots[name] = payload
        return snapshot

    def list(self, workspace_path: str) -> List[WorkspaceSnapshot]:
        """List all snapshots for a workspace.

        Args:
            workspace_path: Root path of the workspace.

        Returns:
            List of WorkspaceSnapshot metadata, ordered oldest first.
        """
        snapshot_dir = self._snapshot_dir(workspace_path)
        if not os.path.isdir(snapshot_dir):
            return []

        snapshots: List[WorkspaceSnapshot] = []
        for filename in sorted(os.listdir(snapshot_dir)):
            if not filename.endswith(".json"):
                continue
            path = os.path.join(snapshot_dir, filename)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                snapshots.append(WorkspaceSnapshot.from_dict(data["metadata"]))
            except (OSError, json.JSONDecodeError, KeyError):
                continue

        return snapshots

    def restore(self, workspace_path: str, name: str) -> Dict[str, Any]:
        """Restore a snapshot's data.

        Args:
            workspace_path: Root path of the workspace.
            name: Snapshot name (filename without .json).

        Returns:
            The restored snapshot payload containing ``objects`` and ``projects``.

        Raises:
            FileNotFoundError: If the snapshot does not exist.
        """
        path = os.path.join(self._snapshot_dir(workspace_path), f"{name}.json")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Snapshot '{name}' not found in {workspace_path}")

        with open(path, "r", encoding="utf-8") as f:
            payload = json.load(f)

        self._snapshots[name] = payload
        return payload

    def diff(
        self, workspace_path: str, name_a: str, name_b: str
    ) -> SnapshotDiff:
        """Compute the diff between two snapshots.

        Args:
            workspace_path: Root path of the workspace.
            name_a: Older snapshot name.
            name_b: Newer snapshot name.

        Returns:
            SnapshotDiff describing added, removed, and modified object IDs.
        """
        payload_a = self._load_payload(workspace_path, name_a)
        payload_b = self._load_payload(workspace_path, name_b)

        objs_a = {o.get("id", o.get("_type", "")): o for o in payload_a.get("objects", [])}
        objs_b = {o.get("id", o.get("_type", "")): o for o in payload_b.get("objects", [])}

        ids_a = set(objs_a.keys())
        ids_b = set(objs_b.keys())

        added = sorted(ids_b - ids_a)
        removed = sorted(ids_a - ids_b)
        modified = sorted(
            oid for oid in ids_a & ids_b if objs_a[oid] != objs_b[oid]
        )

        return SnapshotDiff(
            snapshot_a=name_a,
            snapshot_b=name_b,
            added=added,
            removed=removed,
            modified=modified,
        )

    def delete(self, workspace_path: str, name: str) -> None:
        """Delete a snapshot.

        Args:
            workspace_path: Root path of the workspace.
            name: Snapshot name to delete.

        Raises:
            FileNotFoundError: If the snapshot does not exist.
        """
        path = os.path.join(self._snapshot_dir(workspace_path), f"{name}.json")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Snapshot '{name}' not found in {workspace_path}")
        os.remove(path)
        self._snapshots.pop(name, None)

    def _load_payload(self, workspace_path: str, name: str) -> Dict[str, Any]:
        path = os.path.join(self._snapshot_dir(workspace_path), f"{name}.json")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Snapshot '{name}' not found in {workspace_path}")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def _snapshot_dir(workspace_path: str) -> str:
        return os.path.join(workspace_path, ".alp", ".snapshots")
