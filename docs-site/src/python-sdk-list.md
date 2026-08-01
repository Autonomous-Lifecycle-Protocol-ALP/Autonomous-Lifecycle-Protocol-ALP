# Python SDK: ListEngine

The `ListEngine` lists all ALP objects in the workspace.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import ListEngine

engine = ListEngine()
result = engine.list("./my-project")

print(f"Total objects: {result.objects['count']}")
for obj in result.objects['objects']:
    print(f"  {obj['type']}:{obj['id']}  [{obj['file']}]")
```

## API Reference

### `ListEngine`

#### `list(workspace_path, type_filter=None) -> ListResult`

Lists all ALP objects in the workspace.

- `workspace_path`: Path to workspace containing `.alp` directory
- `type_filter`: Optional type filter (e.g. `task`, `agent`)

#### `ListResult`

- `objects`: List of object dictionaries with `id`, `type`, and `file` keys
- `count`: Total number of objects

## Examples

### List All Objects

```python
from alp_sdk import ListEngine

engine = ListEngine()
result = engine.list("./my-project")
print(result.to_dict())
```

### Filter by Type

```python
from alp_sdk import ListEngine

engine = ListEngine()
result = engine.list("./my-project", type_filter="task")
for obj in result.objects['objects']:
    print(f"{obj['id']} in {obj['file']}")
```
