# Python SDK: FormatEngine

The `FormatEngine` formats ALP files with consistent indentation and style.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import FormatEngine

engine = FormatEngine()
result = engine.format_file("./my-project/tasks.alp")

if result.changed:
    print(f"Formatted {result.changed} file(s)")
else:
    print("Already formatted")
```

## API Reference

### `FormatEngine`

#### `format_file(filepath, check=False) -> FormatResult`

Format a single ALP file.

- `filepath`: Path to the `.alp` file to format
- `check`: If `True`, only check if formatting is needed without writing changes

#### `format_directory(dirpath, check=False) -> FormatResult`

Format all `.alp` files in a directory recursively.

- `dirpath`: Path to the directory to format
- `check`: If `True`, only check if formatting is needed without writing changes

### `FormatResult`

- `changed`: Number of files that were formatted
- `checked`: Number of files that were checked
- `files`: List of file paths that were changed

## Examples

### Format a Single File

```python
from alp_sdk import FormatEngine

engine = FormatEngine()
result = engine.format_file("./my-project/tasks.alp")

print(f"Formatted {result.changed} file(s)")
for filepath in result.files:
    print(f"  {filepath}")
```

### Format a Directory

```python
from alp_sdk import FormatEngine

engine = FormatEngine()
result = engine.format_directory("./my-project")

print(f"Formatted {result.changed} of {result.checked} files")
```

### Check Formatting

```python
from alp_sdk import FormatEngine

engine = FormatEngine()
result = engine.format_directory("./my-project", check=True)

if result.changed > 0:
    print(f"{result.changed} file(s) need formatting")
else:
    print("All files are formatted correctly")
```
