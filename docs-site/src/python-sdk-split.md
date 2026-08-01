# Python SDK: SplitEngine

The `SplitEngine` splits an ALP file into multiple files by object type.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import SplitEngine

engine = SplitEngine()
result = engine.split("./my-project", "mixed.alp")

print(f"Created {len(result.created_files)} files:")
for file in result.created_files:
    print(f"  - {file}")
```

## API Reference

### `SplitEngine`

#### `split(workspace_path, source_file, type_filter=None) -> SplitResult`

Splits an ALP file into multiple files based on object types.

- `workspace_path`: Path to workspace containing `.alp` directory
- `source_file`: Source `.alp` filename to split
- `type_filter`: Optional type to filter by (e.g. `task`, `agent`)

#### `SplitResult`

- `source_file`: Source file path
- `created_files`: List of created filenames
- `total_objects`: Total number of objects processed

## Examples

### Split by Type

```python
from alp_sdk import SplitEngine

engine = SplitEngine()
result = engine.split("./my-project", "mixed.alp")
print(result.to_dict())
```

### Split with Type Filter

```python
from alp_sdk import SplitEngine

engine = SplitEngine()
result = engine.split("./my-project", "mixed.alp", type_filter="task")
print(result.created_files)
```

### Handle Missing File

```python
from alp_sdk import SplitEngine

engine = SplitEngine()
try:
    result = engine.split("./my-project", "missing.alp")
except FileNotFoundError as e:
    print(f"Error: {e}")
```
