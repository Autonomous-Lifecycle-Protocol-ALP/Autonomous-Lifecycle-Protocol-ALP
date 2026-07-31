# Python SDK — MoveEngine

The `MoveEngine` moves ALP objects between files within a workspace. It is the reorganization counterpart to `CopyEngine` and `RefactorEngine`.

## Installation

```bash
pip install @autonomous-lifecycle-protocol-alp/sdk
```

## Quick start

```python
from alp_sdk import MoveEngine

engine = MoveEngine()
result = engine.move("/path/to/workspace", "task-1", "tasks.alp")

print(result.source_file, "->", result.target_file)
print(result.to_dict())
```

## Classes

### `MoveEngine`

| Method | Description |
|--------|-------------|
| `move(workspace_path, object_id, target_filename)` | Move an object from its current file to `target_filename` under `.alp/` |

The object block is extracted from the source file and appended to the target file. The source file is updated to remove the moved object.

Raises `FileNotFoundError` if `.alp/` is missing or the object is not found. Raises `ValueError` if the target filename does not end with `.alp`.

### `MoveResult`

Fields: `object_id`, `source_file`, `target_file`.

Methods: `to_dict()`.

## CLI integration

```bash
alp move <id> <target-file>
```

Moves the object block from its current file to the target `.alp` file, creating the target if needed.

## VS Code integration

Use **ALP: Move Object** (`alp.moveObject`) from the command palette. It prompts for the object id and target file, then updates both the active file and the target file.
