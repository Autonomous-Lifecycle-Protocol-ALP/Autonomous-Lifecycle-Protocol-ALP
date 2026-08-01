# Python SDK: LintEngine

The `LintEngine` lints ALP files for style conventions and best practices.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import LintEngine

engine = LintEngine()
result = engine.lint_directory("./my-project")

for diagnostic in result.diagnostics:
    print(f"{diagnostic.severity}: {diagnostic.file} - {diagnostic.message}")
```

## API Reference

### `LintEngine`

#### `lint_file(filepath) -> LintResult`

Lint a single ALP file.

- `filepath`: Path to the `.alp` file to lint

#### `lint_directory(dirpath) -> LintResult`

Lint all `.alp` files in a directory recursively.

- `dirpath`: Path to the directory to lint

### `LintResult`

- `diagnostics`: List of `LintDiagnostic` objects
- `count`: Total number of diagnostics
- `errors`: Number of error-level diagnostics
- `warnings`: Number of warning-level diagnostics

### `LintDiagnostic`

- `file`: Path to the file containing the issue
- `message`: Description of the issue
- `severity`: Severity level (`error` or `warning`)

## Examples

### Lint a Single File

```python
from alp_sdk import LintEngine

engine = LintEngine()
result = engine.lint_file("./my-project/tasks.alp")

for diagnostic in result.diagnostics:
    print(f"{diagnostic.severity}: {diagnostic.message}")
```

### Lint a Directory

```python
from alp_sdk import LintEngine

engine = LintEngine()
result = engine.lint_directory("./my-project")

print(f"Found {result.count} issues ({result.errors} errors, {result.warnings} warnings)")
for diagnostic in result.diagnostics:
    print(f"  {diagnostic.file}: {diagnostic.message}")
```
