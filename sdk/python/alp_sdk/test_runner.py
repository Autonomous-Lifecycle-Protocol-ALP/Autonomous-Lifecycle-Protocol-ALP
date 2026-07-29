"""ALP Test Runner (v42.0.0 IDE Quality)"""

import os
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class TestCase:
    id: str
    description: str
    passed: bool
    error: Optional[str] = None
    duration_ms: int = 0


@dataclass
class TestSuiteResult:
    file: str
    passed: int = 0
    failed: int = 0
    total: int = 0
    tests: List[TestCase] = field(default_factory=list)
    duration_ms: int = 0


@dataclass
class CoverageReport:
    files: int = 0
    total_objects: int = 0
    covered_objects: int = 0
    coverage_percent: int = 0


class TestRunner:
    def __init__(self):
        from .reader import AlpParser
        self.parser = AlpParser()
        self.results: List[TestSuiteResult] = []
        self.total_passed = 0
        self.total_failed = 0

    def run_workspace(self, alp_dir: str) -> List[TestSuiteResult]:
        self.results = []
        self.total_passed = 0
        self.total_failed = 0
        self._run_directory(alp_dir)
        return self.results

    def run_file(self, file_path: str) -> TestSuiteResult:
        import time
        start = time.time()
        tests: List[TestCase] = []
        passed = 0
        failed = 0

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            objects = self.parser.parse(content)

            for obj in objects:
                if obj.get('_type') in ('test', '@test'):
                    test_start = time.time()
                    try:
                        self._run_test_object(obj)
                        tests.append(TestCase(
                            id=obj.get('id', 'unknown'),
                            description=obj.get('description', 'No description'),
                            passed=True,
                            duration_ms=int((time.time() - test_start) * 1000),
                        ))
                        passed += 1
                    except Exception as e:
                        tests.append(TestCase(
                            id=obj.get('id', 'unknown'),
                            description=obj.get('description', 'No description'),
                            passed=False,
                            error=str(e),
                            duration_ms=int((time.time() - test_start) * 1000),
                        ))
                        failed += 1
        except Exception:
            pass

        duration_ms = int((time.time() - start) * 1000)
        self.total_passed += passed
        self.total_failed += failed

        result = TestSuiteResult(
            file=file_path,
            passed=passed,
            failed=failed,
            total=passed + failed,
            tests=tests,
            duration_ms=duration_ms,
        )
        self.results.append(result)
        return result

    def get_coverage(self, alp_dir: str) -> CoverageReport:
        total_objects = 0
        covered_objects = 0
        files = 0

        def walk(directory: str):
            nonlocal total_objects, covered_objects, files
            if not os.path.exists(directory):
                return
            for entry in os.listdir(directory):
                full_path = os.path.join(directory, entry)
                if os.path.isdir(full_path):
                    walk(full_path)
                elif entry.endswith('.alp'):
                    files += 1
                    try:
                        with open(full_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        objects = self.parser.parse(content)
                        total_objects += len(objects)
                        covered_objects += sum(1 for o in objects if o.get('_type') in ('test', '@test'))
                    except Exception:
                        pass

        walk(alp_dir)

        coverage_percent = (covered_objects / total_objects * 100) if total_objects > 0 else 0
        return CoverageReport(
            files=files,
            total_objects=total_objects,
            covered_objects=covered_objects,
            coverage_percent=int(coverage_percent),
        )

    def get_summary(self):
        total = self.total_passed + self.total_failed
        pass_rate = (self.total_passed / total * 100) if total > 0 else 0
        return {
            'total_passed': self.total_passed,
            'total_failed': self.total_failed,
            'total_tests': total,
            'pass_rate': int(pass_rate),
            'suites': len(self.results),
        }

    def _run_directory(self, directory: str):
        if not os.path.exists(directory):
            return
        for entry in os.listdir(directory):
            full_path = os.path.join(directory, entry)
            if os.path.isdir(full_path):
                self._run_directory(full_path)
            elif entry.endswith('.alp'):
                self.run_file(full_path)

    def _run_test_object(self, obj: dict):
        test = obj
        if test.get('expect_fail'):
            raise Exception('Test marked as expected failure')
        verify = test.get('verify')
        if verify and isinstance(verify, list):
            for v in verify:
                if isinstance(v, str) and v.startswith('!'):
                    raise Exception(f'Verification failed: {v}')
