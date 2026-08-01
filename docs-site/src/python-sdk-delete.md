# Python SDK: DeleteEngine

The `DeleteEngine` deletes an ALP object from a workspace file.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import DeleteEngine

engine = DeleteEngine()
result = engine.delete("./my-project", "task-1")

print(f"Deleted: {result.deleted}")
print(f"File: {result.file}")
```

## API Reference

### `DeleteEngine`

#### `delete(workspace_path, object_id, file=None) -> DeleteResult`

Deletes an ALP object by id from a workspace file.

- `workspace_path`: Path to workspace containing `.alp` directory
- `object_id`: The object id to delete
- `file`: Optional specific file path to delete from. If omitted, searches all `.alp` files

#### `DeleteResult`

- `object_id`: The deleted object's id
- `file`: The file where the object was deleted
- `deleted`: `True` if the object was successfully deleted

## Examples

### Delete by ID

```python
from alp_sdk import DeleteEngine

engine = DeleteEngine()
result = engine.delete("./my-project", "old-task")
print(f"Deleted: {result.deleted}")
```

### Delete from Specific File

```python
from alp_sdk import DeleteEngine

engine = DeleteEngine()
result = engine.delete("./my-project", "task-1", file=".alp/tasks.alp")
print(f"Deleted from {result.file}")
```

### Handle Missing Object

```python
from alp_sdk import DeleteEngine

engine = DeleteEngine()
try:
    result = engine.delete("./my-project", "missing")
except FileNotFoundError as e:
    print(f"Not found: {e}")
```
