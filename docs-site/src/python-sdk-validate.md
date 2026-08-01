# Python SDK: ValidateEngine

The `ValidateEngine` validates ALP files against schemas.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import ValidateEngine

engine = ValidateEngine()
result = engine.validate_file("./my-project/tasks.alp")

if result.valid:
    print("All valid!")
else:
    for error in result.errors:
        print(f"  {error.file}: {error.message}")
```

## API Reference

### `ValidateEngine`

#### `validate_file(filepath) -> ValidationResult`

Validate a single ALP file.

- `filepath`: Path to the `.alp` file to validate

#### `validate_directory(dirpath) -> ValidationResult`

Validate all `.alp` files in a directory recursively.

- `dirpath`: Path to the directory to validate

### `ValidationResult`

- `valid`: Boolean indicating if validation passed
- `errors`: List of `ValidationError` objects
- `count`: Total number of errors

### `ValidationError`

- `file`: Path to the file containing the error
- `message`: Error message
- `details`: Optional dictionary with additional error details

## Examples

### Validate a Single File

```python
from alp_sdk import ValidateEngine

engine = ValidateEngine()
result = engine.validate_file("./my-project/tasks.alp")

if result.valid:
    print("File is valid!")
else:
    for error in result.errors:
        print(f"Error in {error.file}: {error.message}")
```

### Validate a Directory

```python
from alp_sdk import ValidateEngine

engine = ValidateEngine()
result = engine.validate_directory("./my-project")

if result.valid:
    print("All files are valid!")
else:
    print(f"Found {result.count} errors")
    for error in result.errors:
        print(f"  {error.file}: {error.message}")
```
