# Python SDK: SearchEngine

The `SearchEngine` searches ALP objects across workspace files by id, description, or regex.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import SearchEngine

engine = SearchEngine()
results = engine.search("./my-project", "task-1")

for r in results:
    print(f"{r.object_type}:{r.object_id} — {r.description}")
```

## API Reference

### `SearchEngine`

#### `search(workspace_path, query, object_type=None, regex=False) -> List[SearchResult]`

Searches all `.alp` files in the workspace `.alp` directory.

- `workspace_path`: Path to workspace containing `.alp` directory
- `query`: Search text or regex pattern
- `object_type`: Optional type filter (e.g. `task`, `agent`, `workflow`)
- `regex`: If `True`, treats `query` as a regular expression

#### `SearchResult`

- `object_id`: The matching object's id
- `object_type`: The object's type (e.g. `task`, `agent`)
- `file`: The filename where the object was found
- `description`: The object's description text

## Examples

### Search by ID

```python
from alp_sdk import SearchEngine

engine = SearchEngine()
results = engine.search("./my-project", "auth-service")
print(f"Found {len(results)} matches")
```

### Search by Description

```python
from alp_sdk import SearchEngine

engine = SearchEngine()
results = engine.search("./my-project", "payment")
for r in results:
    print(f"{r.object_type}:{r.object_id} — {r.description}")
```

### Regex Search

```python
from alp_sdk import SearchEngine

engine = SearchEngine()
results = engine.search("./my-project", "^task-\\d+$", regex=True)
print(f"Found {len(results)} tasks matching pattern")
```

### Filter by Type

```python
from alp_sdk import SearchEngine

engine = SearchEngine()
results = engine.search("./my-project", "api", object_type="agent")
for r in results:
    print(f"{r.object_id} ({r.file})")
```
