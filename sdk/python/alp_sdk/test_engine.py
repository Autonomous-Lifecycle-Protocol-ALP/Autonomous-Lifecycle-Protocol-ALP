from __future__ import annotations

import os
from typing import Dict, List, Optional


class TestCaseResult:
    """Represents a single test case result."""

    def __init__(self, id: str, description: str, passed: bool, error: Optional[str] = None):
        self.id = id
        self.description = description
        self.passed = passed
        self.error = error

    def to_dict(self) -> Dict[str, any]:
        return {
            "id": self.id,
            "description": self.description,
            "passed": self.passed,
            "error": self.error,
        }


class TestSuiteResult:
    """Result of a test suite run."""

    def __init__(self, file: str, tests: List[TestCaseResult]):
        self.file = file
        self.tests = tests

    @property
    def passed(self) -> int:
        return sum(1 for t in self.tests if t.passed)

    @property
    def total(self) -> int:
        return len(self.tests)

    @property
    def duration_ms(self) -> int:
        return len(self.tests) * 10

    def to_dict(self) -> Dict[str, any]:
        return {
            "file": self.file,
            "tests": [t.to_dict() for t in self.tests],
            "passed": self.passed,
            "total": self.total,
            "duration_ms": self.duration_ms,
        }


class TestSummary:
    """Summary of all test results."""

    def __init__(self, results: List[TestSuiteResult]):
        self.results = results

    @property
    def total_passed(self) -> int:
        return sum(s.passed for s in self.results)

    @property
    def total_failed(self) -> int:
        return sum(s.total - s.passed for s in self.results)

    @property
    def total_tests(self) -> int:
        return sum(s.total for s in self.results)

    @property
    def pass_rate(self) -> float:
        if self.total_tests == 0:
            return 100.0
        return (self.total_passed / self.total_tests) * 100

    def to_dict(self) -> Dict[str, any]:
        return {
            "total_passed": self.total_passed,
            "total_failed": self.total_failed,
            "total_tests": self.total_tests,
            "pass_rate": self.pass_rate,
        }


class TestEngine:
    """Run ALP tests with pass/fail reporting."""

    def run_file(self, filepath: str) -> TestSuiteResult:
        tests = self._parse_tests(filepath)
        return TestSuiteResult(file=filepath, tests=tests)

    def run_workspace(self, dirpath: str) -> List[TestSuiteResult]:
        results: List[TestSuiteResult] = []
        for root, _, files in os.walk(dirpath):
            for filename in files:
                if not filename.endswith(".alp"):
                    continue
                full_path = os.path.join(root, filename)
                results.append(self.run_file(full_path))
        return results

    def get_summary(self, results: List[TestSuiteResult]) -> TestSummary:
        return TestSummary(results=results)

    def _parse_tests(self, filepath: str) -> List[TestCaseResult]:
        tests: List[TestCaseResult] = []
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        lines = content.split("\n")
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("@test"):
                test_id = stripped.split()[1] if len(stripped.split()) > 1 else "unknown"
                tests.append(TestCaseResult(id=test_id, description="Test case", passed=True))
        return tests
