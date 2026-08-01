# Python SDK: MergeEngine

The `MergeEngine` merges objects from a source ALP file into a target ALP file.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import MergeEngine

engine = MergeEngine()
result = engine.merge("./my-project", "source.alp", "target.alp")

print(f"Merged {result.merged_count} objects")
for obj_id in result.merged_ids:
    print(f"  - {obj_id}")
```

## API Reference

### `MergeEngine`

#### `merge(workspace_path, source_file, target_file, overwrite=False) -> MergeResult`

Merges objects from a source ALP file into a target ALP file.

- `workspace_path`: Path to workspace containing `.alp` directory
- `source_file`: Source `.alp` filename (e.g. `source.alp`)
- `target_file`: Target `.alp` filename (e.g. `target.alp`)
- `overwrite`: If `True`, merge all objects including duplicates (default `False`)

#### `MergeResult`

- `source_file`: Source file path
- `target_file`: Target file path
- `merged_count`: Number of objects merged
- `merged_ids`: List of merged object ids

## Examples

### Merge New Objects

```python
from alp_sdk import MergeEngine

engine = MergeEngine()
result = engine.merge("./my-project", "tasks.alp", "backlog.alp")
print(result.to_dict())
```

### Overwrite Existing Objects

```python
from alp_sdk import MergeEngine

engine = MergeEngine()
result = engine.merge("./my-project", "source.alp", "target.alp", overwrite=True)
print(f"Merged {result.merged_count} objects")
```

### Handle Missing Files

```python
from alp_sdk import MergeEngine

engine = MergeEngine()
try:
    result = engine.merge("./my-project", "missing.alp", "target.alp")
except FileNotFoundError as e:
    print(f"Error: {e}")
```
