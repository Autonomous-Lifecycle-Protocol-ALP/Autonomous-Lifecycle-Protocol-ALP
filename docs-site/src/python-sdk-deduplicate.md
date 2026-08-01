# Python SDK: DeduplicateEngine

The `DeduplicateEngine` removes duplicate ALP objects from workspace files.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import DeduplicateEngine

engine = DeduplicateEngine()
result = engine.deduplicate("./my-project")

print(f"Removed {result.removed_count} duplicates")
for obj_id in result.removed_ids:
    print(f"  - {obj_id}")
```

## API Reference

### `DeduplicateEngine`

#### `deduplicate(workspace_path) -> DeduplicateResult`

Scans all `.alp` files in the workspace and removes duplicate objects (by `id`), keeping only the first occurrence.

- `workspace_path`: Path to workspace containing `.alp` directory

#### `DeduplicateResult`

- `removed_count`: Number of duplicate objects removed
- `removed_ids`: List of removed object ids

## Examples

### Deduplicate Workspace

```python
from alp_sdk import DeduplicateEngine

engine = DeduplicateEngine()
result = engine.deduplicate("./my-project")
print(result.to_dict())
```

### Handle Missing Directory

```python
from alp_sdk import DeduplicateEngine

engine = DeduplicateEngine()
try:
    result = engine.deduplicate("./invalid-path")
except FileNotFoundError as e:
    print(f"Error: {e}")
```
