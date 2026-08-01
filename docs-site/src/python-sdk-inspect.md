# Python SDK: InspectEngine

The `InspectEngine` inspects a specific ALP object and returns its properties.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import InspectEngine

engine = InspectEngine()
result = engine.inspect("./my-project", "task-1")

print(f"Type: {result.object_type}")
print(f"File: {result.file}")
for key, value in result.properties.items():
    print(f"  {key}: {value}")
```

## API Reference

### `InspectEngine`

#### `inspect(workspace_path, object_id, file=None) -> InspectResult`

Inspects an ALP object by id.

- `workspace_path`: Path to workspace containing `.alp` directory
- `object_id`: The object id to inspect
- `file`: Optional specific file path to inspect. If omitted, searches all `.alp` files

#### `InspectResult`

- `object_id`: The inspected object's id
- `object_type`: The object's type (e.g. `task`, `agent`)
- `file`: The file where the object was found
- `properties`: Dictionary of object properties

## Examples

### Inspect by ID

```python
from alp_sdk import InspectEngine

engine = InspectEngine()
result = engine.inspect("./my-project", "auth-service")
print(result.to_dict())
```

### Inspect from Specific File

```python
from alp_sdk import InspectEngine

engine = InspectEngine()
result = engine.inspect("./my-project", "agent-1", file=".alp/agents.alp")
print(f"Model: {result.properties.get('model')}")
```

### Handle Missing Object

```python
from alp_sdk import InspectEngine

engine = InspectEngine()
try:
    result = engine.inspect("./my-project", "missing")
except FileNotFoundError as e:
    print(f"Not found: {e}")
```
