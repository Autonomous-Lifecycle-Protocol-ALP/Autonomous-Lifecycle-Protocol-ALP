# Python SDK — RefactorEngine

The `RefactorEngine` renames ALP object ids across all `.alp` files in a workspace. It is the counterpart to `SnapshotEngine` and `DiffEngine` in the workspace-management toolkit.

## Installation

```bash
pip install @autonomous-lifecycle-protocol-alp/sdk
```

## Quick start

```python
from alp_sdk import RefactorEngine

engine = RefactorEngine()
result = engine.rename("/path/to/workspace", "old-task-id", "new-task-id")

print(result.replacements, "replacements across", result.files_updated, "files")
print(result.to_dict())
```

## Classes

### `RefactorEngine`

| Method | Description |
|--------|-------------|
| `rename(workspace_path, old_id, new_id)` | Rename `id: old-id` to `id: new-id` in every `.alp` file under `.alp/` |

Only top-level `id:` declarations are renamed. References in other fields (`depends_on`, etc.) are not rewritten.

### `RenameResult`

Fields: `old_id`, `new_id`, `files_updated`, `replacements`.

Methods: `to_dict()`.

## CLI integration

```bash
alp rename <old-id> <new-id>
```

Renames matching `id:` declarations across all `.alp` files and reports the number of replacements per file.

## VS Code integration

Use **ALP: Rename Object** (`alp.renameObject`) from the command palette. It prompts for the current id and new id, then updates the active ALP file in place.
