# Python SDK — DiffEngine

The `DiffEngine` computes structural diffs between two workspace states or snapshot files. It is the logical counterpart to `SnapshotEngine`: where `SnapshotEngine` captures state, `DiffEngine` tells you what changed between two states.

## Installation

```bash
pip install @autonomous-lifecycle-protocol-alp/sdk
```

## Quick start

```python
from alp_sdk import DiffEngine

engine = DiffEngine()

# Diff two in-memory object lists
result = engine.diff_objects(objects_a, objects_b, label_a="before", label_b="after")

print(result.summary())
# Diff: before -> after: +1 -0 ~2

for entry in result.added:
    print(f"+ {entry.obj_id}")

for entry in result.modified:
    print(f"~ {entry.obj_id}")
```

## Diff two snapshots

```python
result = engine.diff_snapshots("/path/to/workspace", "snap-20260101", "snap-20260102")

for entry in result.modified:
    print(entry.obj_id, entry.before, entry.after)
```

## Classes

### `DiffEngine`

| Method | Description |
|--------|-------------|
| `diff_objects(objects_a, objects_b, label_a, label_b)` | Diff two lists of ALP object dicts |
| `diff_snapshots(workspace_path, name_a, name_b)` | Diff two `.alp/.snapshots/<name>.json` files |

Objects are keyed by `id`, falling back to `_type`, then to a deterministic JSON string. Equality is deep (JSON-serialized), so two objects with the same `id` but different fields count as modified.

### `DiffResult`

Properties: `source_a`, `source_b`, `added`, `removed`, `modified`, `is_empty`.

Methods: `add(entry)`, `to_dict()`, `summary()`.

### `DiffEntry`

Represents a single change. Fields: `obj_id`, `change_type` (`"added"`, `"removed"`, `"modified"`), `before`, `after`.

## CLI integration

```bash
alp diff <snapshot-a> <snapshot-b>
```

Outputs counts of added, removed, and modified object IDs, plus a per-ID breakdown.

## VS Code integration

Use the **ALP: Diff Workspace Snapshots** command (`alp.diffWorkspace`) to pick two snapshots from the command palette and view a color-coded diff panel.
