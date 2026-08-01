# Python SDK: RefactorEngine

The `RefactorEngine` supports renaming ALP objects and updating cross-references automatically.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import RefactorEngine

engine = RefactorEngine()
result = engine.rename(".alp", "task-1", "task-1-renamed", update_refs=True)

print(f"Renamed {result.occurrences} occurrences")
print(f"Updated {result.references_updated} references")
```

## API Reference

### `RefactorEngine`

#### `rename(workspace_path, old_id, new_id, update_refs=False) -> RenameResult`

Renames an ALP object and optionally updates all references to it.

- `workspace_path`: Path to workspace containing `.alp` directory
- `old_id`: Current object ID
- `new_id`: New object ID
- `update_refs`: If `True`, updates reference fields (`depends_on`, `references`, `links`, `parent`, `child`) that point to `old_id`

#### `RenameResult`

- `occurrences`: Number of `id:` fields renamed
- `references_updated`: Number of reference fields updated
- `files_modified`: Number of files changed

## Reference Fields

The following fields are treated as references when `update_refs=True`:

- `depends_on`
- `references`
- `links`
- `parent`
- `child`

## Examples

### Basic Rename

```python
from alp_sdk import RefactorEngine

engine = RefactorEngine()
result = engine.rename("./my-project", "old-task", "new-task")
print(f"Renamed {result.occurrences} occurrences in {result.files_modified} files")
```

### Rename with Reference Updates

```python
from alp_sdk import RefactorEngine

engine = RefactorEngine()
result = engine.rename(
    "./my-project",
    "auth-service",
    "auth-service-v2",
    update_refs=True
)
print(f"Renamed {result.occurrences} occurrences, updated {result.references_updated} references")
```
