# Python SDK: TestEngine

The `TestEngine` runs ALP tests with pass/fail reporting.

## Installation

```bash
pip install autonomous-lifecycle-protocol-alp
```

## Quick Start

```python
from alp_sdk import TestEngine

engine = TestEngine()
results = engine.run_workspace("./my-project")
summary = engine.get_summary(results)

print(f"Pass rate: {summary.pass_rate}%")
```

## API Reference

### `TestEngine`

#### `run_file(filepath) -> TestSuiteResult`

Run tests in a single ALP file.

- `filepath`: Path to the `.alp` file containing tests

#### `run_workspace(dirpath) -> List[TestSuiteResult]`

Run tests in all `.alp` files in a directory recursively.

- `dirpath`: Path to the directory to test

#### `get_summary(results) -> TestSummary`

Get a summary of test results.

- `results`: List of `TestSuiteResult` objects

### `TestSuiteResult`

- `file`: Path to the test file
- `tests`: List of `TestCase` objects
- `passed`: Number of passed tests
- `total`: Total number of tests
- `duration_ms`: Duration in milliseconds

### `TestCase`

- `id`: Test identifier
- `description`: Test description
- `passed`: Whether the test passed
- `error`: Error message if failed

### `TestSummary`

- `total_passed`: Total passed tests
- `total_failed`: Total failed tests
- `total_tests`: Total tests run
- `pass_rate`: Pass rate percentage

## Examples

### Run Tests in a File

```python
from alp_sdk import TestEngine

engine = TestEngine()
result = engine.run_file("./my-project/tasks.alp")

for test in result.tests:
    status = "PASS" if test.passed else "FAIL"
    print(f"[{status}] {test.id}: {test.description}")
```

### Run Tests in a Workspace

```python
from alp_sdk import TestEngine

engine = TestEngine()
results = engine.run_workspace("./my-project")
summary = engine.get_summary(results)

print(f"Pass rate: {summary.pass_rate}%")
print(f"Passed: {summary.total_passed}/{summary.total_tests}")
```
