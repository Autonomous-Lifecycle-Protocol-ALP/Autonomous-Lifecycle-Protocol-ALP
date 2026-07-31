# Python SDK — StatsEngine

The `StatsEngine` computes workspace statistics from parsed ALP files: total object counts, breakdowns by type, and per-file summaries.

## Installation

```bash
pip install @autonomous-lifecycle-protocol-alp/sdk
```

## Quick start

```python
from alp_sdk import StatsEngine

engine = StatsEngine()
stats = engine.compute("/path/to/workspace", parse_fn)

print(stats.total_objects, "objects across", stats.files, "files")
for type_name, count in stats.top_types:
    print(f"  {type_name}: {count}")
```

`parse_fn` is any callable that accepts raw ALP file content and returns a list of object dicts. You can pass `AlpParser.parseAndValidate` or a lighter custom parser depending on your needs.

## Classes

### `StatsEngine`

| Method | Description |
|--------|-------------|
| `compute(workspace_path, parse_fn)` | Scan `.alp/*.alp` and return `WorkspaceStats` |

Objects are keyed by `_type`, falling back to `type`, then `unknown`.

### `WorkspaceStats`

Fields: `files`, `total_objects`, `type_counts`, `file_stats`.

Properties: `top_types` (sorted list of `(type, count)` tuples).

Methods: `add_file()`, `to_dict()`.

### `FileStats`

Fields: `file`, `object_count`.

Methods: `to_dict()`.

## CLI integration

```bash
alp stats
```

Outputs file count, total object count, breakdown by type, and per-file object counts.

## VS Code integration

Use **ALP: Show Workspace Stats** (`alp.showStats`) from the command palette. It opens a webview panel showing object counts by type for the active ALP file.
