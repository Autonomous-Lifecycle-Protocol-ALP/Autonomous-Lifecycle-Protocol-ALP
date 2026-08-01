# Python SDK: PromoteEngine

The `PromoteEngine` promotes an ALP object from one type to another.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import PromoteEngine

engine = PromoteEngine()
result = engine.promote("./my-project", "task-1", "feature")

print(f"Promoted {result.object_id} from @{result.old_type} to @{result.new_type}")
print(f"File: {result.file}")
```

## API Reference

### `PromoteEngine`

#### `promote(workspace_path, object_id, new_type, file=None) -> PromoteResult`

Promotes an ALP object to a different type by changing its `@type` declaration.

- `workspace_path`: Path to workspace containing `.alp` directory
- `object_id`: The object id to promote
- `new_type`: The new object type (e.g. `feature`, `agent`)
- `file`: Optional specific file path. If omitted, searches all `.alp` files

#### `PromoteResult`

- `object_id`: The promoted object's id
- `old_type`: The object's previous type
- `new_type`: The object's new type
- `file`: The file where the object was found

## Examples

### Promote by ID

```python
from alp_sdk import PromoteEngine

engine = PromoteEngine()
result = engine.promote("./my-project", "task-1", "feature")
print(result.to_dict())
```

### Promote from Specific File

```python
from alp_sdk import PromoteEngine

engine = PromoteEngine()
result = engine.promote("./my-project", "task-1", "feature", file=".alp/tasks.alp")
print(f"New type: {result.new_type}")
```

### Handle Missing Object

```python
from alp_sdk import PromoteEngine

engine = PromoteEngine()
try:
    result = engine.promote("./my-project", "missing", "feature")
except FileNotFoundError as e:
    print(f"Not found: {e}")
```
