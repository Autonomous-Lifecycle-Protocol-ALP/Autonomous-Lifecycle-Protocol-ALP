# Python SDK: VisualizeEngine

The `VisualizeEngine` generates diagrams from `@workflow` objects.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import VisualizeEngine

engine = VisualizeEngine()
diagrams = engine.visualize_file("./my-project/workflows.alp")

for diagram in diagrams:
    print(diagram.content)
```

## API Reference

### `VisualizeEngine`

#### `visualize_file(filepath, format='mermaid') -> List[WorkflowDiagram]`

Generate diagrams from workflows in a single ALP file.

- `filepath`: Path to the `.alp` file containing workflows
- `format`: Output format (`mermaid`, `dot`, or `json`)

#### `visualize_directory(dirpath, format='mermaid') -> List[WorkflowDiagram]`

Generate diagrams from all workflows in a directory recursively.

- `dirpath`: Path to the directory to scan
- `format`: Output format (`mermaid`, `dot`, or `json`)

### `WorkflowDiagram`

- `workflow_id`: ID of the workflow
- `format`: Diagram format
- `content`: Generated diagram content

## Examples

### Generate Mermaid Diagram

```python
from alp_sdk import VisualizeEngine

engine = VisualizeEngine()
diagrams = engine.visualize_file("./my-project/workflows.alp", format="mermaid")

for diagram in diagrams:
    print(diagram.content)
```

### Generate DOT Diagram

```python
from alp_sdk import VisualizeEngine

engine = VisualizeEngine()
diagrams = engine.visualize_file("./my-project/workflows.alp", format="dot")

for diagram in diagrams:
    print(diagram.content)
```

### Visualize All Workflows

```python
from alp_sdk import VisualizeEngine

engine = VisualizeEngine()
diagrams = engine.visualize_directory("./my-project")

for diagram in diagrams:
    print(f"Workflow: {diagram.workflow_id}")
    print(diagram.content)
```
