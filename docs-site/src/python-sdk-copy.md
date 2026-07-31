# Python SDK — CopyEngine

The `CopyEngine` duplicates ALP object ids across all `.alp` files in a workspace. It is the third tool in the workspace-management toolkit alongside `SnapshotEngine`, `DiffEngine`, and `RefactorEngine`.

## Installation

```bash
pip install @autonomous-lifecycle-protocol-alp/sdk
```

## Quick start

```python
from alp_sdk import CopyEngine

engine = CopyEngine()

# Basic copy: duplicate an object id
result = engine.copy("/path/to/workspace", "source-id", "target-id")
print(result.copies, "copies across", result.files_updated, "files")

# Copy with reference update
result = engine.copy("/path/to/workspace", "source-id", "target-id", update_refs=True)
print(result.to_dict())
```

## Classes

### `CopyEngine`

| Method | Description |
|--------|-------------|
| `copy(workspace_path, source_id, target_id, update_refs=False)` | Copy `id: source-id` to `id: target-id` in every `.alp` file under `.alp/` |

When `update_refs=True`, reference fields (`depends_on`, `references`, `links`, `parent`, `child`) pointing to `source-id` are also rewritten to `target-id`.

### `CopyResult`

Fields: `source_id`, `target_id`, `files_updated`, `copies`.

Methods: `to_dict()`.

## CLI integration

```bash
alp copy <source-id> <target-id> [--update-refs]
```

Copies matching `id:` declarations across all `.alp` files. Use `--update-refs` to also rewrite reference fields.

## VS Code integration

Use **ALP: Copy Object** (`alp.copyObject`) from the command palette. It prompts for the source id, target id, and whether to update references, then modifies the active ALP file in place.
