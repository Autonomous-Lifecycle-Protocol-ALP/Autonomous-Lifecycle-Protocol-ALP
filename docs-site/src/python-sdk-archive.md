# Python SDK: ArchiveEngine

The `ArchiveEngine` moves objects with a given status to an archive file.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import ArchiveEngine

engine = ArchiveEngine()
result = engine.archive("./my-project", "done")

print(f"Archived {result.archived_count} objects")
for obj_id in result.archived_ids:
    print(f"  - {obj_id}")
print(f"Archive file: {result.archive_file}")
```

## API Reference

### `ArchiveEngine`

#### `archive(workspace_path, status) -> ArchiveResult`

Scans all `.alp` files and moves objects with the given status to `archive.alp`.

- `workspace_path`: Path to workspace containing `.alp` directory
- `status`: Status value to archive (e.g. `done`, `archived`)

#### `ArchiveResult`

- `status`: The status that was archived
- `archived_count`: Number of objects archived
- `archived_ids`: List of archived object ids
- `archive_file`: Path to the archive file

## Examples

### Archive Completed Tasks

```python
from alp_sdk import ArchiveEngine

engine = ArchiveEngine()
result = engine.archive("./my-project", "done")
print(result.to_dict())
```

### Handle Missing Directory

```python
from alp_sdk import ArchiveEngine

engine = ArchiveEngine()
try:
    result = engine.archive("./invalid-path", "done")
except FileNotFoundError as e:
    print(f"Error: {e}")
```
