# Python SDK: StatusEngine

The `StatusEngine` shows project state and progress.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import StatusEngine

engine = StatusEngine()
result = engine.get_status("./my-project")

for type_name, counts in result.stats.items():
    print(f"{type_name.upper()}S: {counts.total} total")
    print(f"  Done: {counts.done}, In Progress: {counts.in_progress}, Todo: {counts.todo}")
```

## API Reference

### `StatusEngine`

#### `get_status(dirpath) -> StatusResult`

Get the status of all ALP objects in a workspace.

- `dirpath`: Path to the workspace containing `.alp` directory

### `StatusResult`

- `stats`: Dictionary mapping object types to `StatusCounts`

### `StatusCounts`

- `total`: Total number of objects of this type
- `done`: Number of completed objects
- `in_progress`: Number of in-progress objects
- `todo`: Number of todo objects
- `blocked`: Number of blocked objects

## Examples

### Get Project Status

```python
from alp_sdk import StatusEngine

engine = StatusEngine()
result = engine.get_status("./my-project")

for type_name, counts in result.stats.items():
    if counts.total > 0:
        print(f"{type_name.upper()}S ({counts.total} total)")
        print(f"  Done: {counts.done}")
        print(f"  In Progress: {counts.in_progress}")
        print(f"  Todo: {counts.todo}")
        print(f"  Blocked: {counts.blocked}")
```
