# Python SDK: GraphEngine

The `GraphEngine` builds dependency graphs from ALP objects.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import GraphEngine

engine = GraphEngine()
result = engine.build_directory("./my-project")

print(f"Nodes: {result.count}")
for node in result.nodes:
    print(f"  {node.type}:{node.id} -> {node.dependencies}")
```

## API Reference

### `GraphEngine`

#### `build_file(filepath) -> GraphResult`

Build a dependency graph from a single ALP file.

- `filepath`: Path to the `.alp` file

#### `build_directory(dirpath) -> GraphResult`

Build a dependency graph from all `.alp` files in a directory recursively.

- `dirpath`: Path to the directory

### `GraphResult`

- `nodes`: List of `GraphNode` objects
- `cycles`: List of cycles detected in the graph
- `count`: Total number of nodes

### `GraphNode`

- `id`: Node identifier
- `type`: Object type (e.g. `task`, `agent`)
- `dependencies`: List of dependency IDs

## Examples

### Build Graph from a File

```python
from alp_sdk import GraphEngine

engine = GraphEngine()
result = engine.build_file("./my-project/tasks.alp")

for node in result.nodes:
    print(f"{node.type}:{node.id}")
    for dep in node.dependencies:
        print(f"  depends on: {dep}")
```

### Build Graph from a Workspace

```python
from alp_sdk import GraphEngine

engine = GraphEngine()
result = engine.build_directory("./my-project")

print(f"Total objects: {result.count}")
for node in result.nodes:
    print(f"  {node.id} ({node.type})")
```
