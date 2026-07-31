# Python SDK: Snapshot Engine

The `SnapshotEngine` in `alp_sdk.snapshot` provides workspace snapshot management: create point-in-time captures of `.alp` workspace state, list available snapshots, restore previous states, diff two snapshots, and delete stale snapshots.

## Installation

```bash
pip install alp-sdk==80.0.0
```

## Quick Start

```python
from alp_sdk.snapshot import SnapshotEngine, WorkspaceSnapshot, SnapshotDiff

engine = SnapshotEngine()

# Create a snapshot from current workspace state
snap = engine.create(
    workspace_path="./my-project",
    objects=[{"id": "task-1", "_type": "task"}, {"id": "task-2", "_type": "task"}],
    projects=[{"id": "core", "path": "./core"}],
    description="before deploy",
)
print(snap.name, snap.object_count, snap.project_count)

# List all snapshots
for s in engine.list("./my-project"):
    print(s.name, s.created_at)

# Restore a snapshot
payload = engine.restore("./my-project", snap.name)
print(len(payload["objects"]), "objects restored")

# Diff two snapshots
diff = engine.diff("./my-project", "snap-old", "snap-new")
print("added:", diff.added)
print("removed:", diff.removed)
print("modified:", diff.modified)

# Delete a snapshot
engine.delete("./my-project", snap.name)
```

## API Reference

### `WorkspaceSnapshot`

Metadata for a single snapshot.

| Field | Type | Description |
|---|---|---|
| `name` | `str` | Snapshot identifier (timestamp-based) |
| `description` | `str` | Human-readable description |
| `object_count` | `int` | Number of objects captured |
| `project_count` | `int` | Number of projects captured |
| `created_at` | `str` | ISO-8601 creation timestamp |

### `SnapshotDiff`

Result of diffing two snapshots.

| Field | Type | Description |
|---|---|---|
| `snapshot_a` | `str` | Source snapshot name |
| `snapshot_b` | `str` | Target snapshot name |
| `added` | `list[str]` | Object IDs added |
| `removed` | `list[str]` | Object IDs removed |
| `modified` | `list[str]` | Object IDs changed |

### `SnapshotEngine`

| Method | Signature | Description |
|---|---|---|
| `create` | `(workspace_path, objects, projects, description="") -> WorkspaceSnapshot` | Capture workspace state to `.alp/.snapshots/` |
| `list` | `(workspace_path) -> list[WorkspaceSnapshot]` | List snapshots ordered oldest-first |
| `restore` | `(workspace_path, name) -> dict` | Load snapshot payload; raises `FileNotFoundError` if missing |
| `diff` | `(workspace_path, name_a, name_b) -> SnapshotDiff` | Compare two snapshots by object ID |
| `delete` | `(workspace_path, name) -> None` | Remove snapshot file; raises `FileNotFoundError` if missing |

## Storage

Snapshots are stored as JSON files under `<workspace_path>/.alp/.snapshots/`. Each file contains:

```json
{
  "metadata": {
    "name": "20260101T120000Z-ab3f",
    "description": "before deploy",
    "object_count": 2,
    "project_count": 1,
    "created_at": "2026-01-01T12:00:00Z"
  },
  "objects": [...],
  "projects": [...]
}
```

## Notes

- Snapshot names include a random suffix to avoid collisions when creating multiple snapshots within the same second.
- `diff` compares objects by their `id` field; objects without an `id` fall back to `_type`.
- The engine is synchronous and uses only the Python standard library (`json`, `os`).
