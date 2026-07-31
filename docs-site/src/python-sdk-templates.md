# Python SDK — TemplateEngine

The `TemplateEngine` creates new ALP objects from built-in templates. It is the scaffolding counterpart to `SnapshotEngine`, `DiffEngine`, `RefactorEngine`, `CopyEngine`, and `StatsEngine`.

## Installation

```bash
pip install @autonomous-lifecycle-protocol-alp/sdk
```

## Quick start

```python
from alp_sdk import TemplateEngine

engine = TemplateEngine()

# Create a task template
path = engine.create("/path/to/workspace", "task", "my-task")
print(path)  # /path/to/workspace/.alp/my-task.alp

# Create with custom filename
path = engine.create("/path/to/workspace", "agent", "a1", filename="custom.alp")
```

## Available templates

| Type | Description |
|------|-------------|
| `task` | Basic task with status, agent, and depends_on |
| `agent` | Agent with model, capabilities, and tools |
| `workflow` | Workflow with steps and triggers |
| `policy` | Policy with rules and enforcement mode |
| `test` | Test with command and expected output |

## Classes

### `TemplateEngine`

| Method | Description |
|--------|-------------|
| `create(workspace_path, type, id, filename=None)` | Create a new `.alp` file from a built-in template |
| `available_types()` | List supported template types |

Raises `FileNotFoundError` if `.alp/` is missing, `ValueError` for unknown types, `FileExistsError` if the target file already exists.

## CLI integration

```bash
alp template <type> <id>
```

Creates `<id>.alp` from the selected template under `.alp/`. Available types: `task`, `agent`, `workflow`, `policy`, `test`.

## VS Code integration

Use **ALP: Create From Template** (`alp.createFromTemplate`) from the command palette. It prompts for template type and object id, then opens the new file in the editor.
