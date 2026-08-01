from __future__ import annotations

import os
from typing import Dict, List, Optional


class LintDiagnostic:
    """Represents a single lint diagnostic."""

    def __init__(self, file: str, message: str, severity: str = "warning"):
        self.file = file
        self.message = message
        self.severity = severity

    def to_dict(self) -> Dict[str, any]:
        return {
            "file": self.file,
            "message": self.message,
            "severity": self.severity,
        }


class LintResult:
    """Result of a lint operation."""

    def __init__(self, diagnostics: List[LintDiagnostic]):
        self.diagnostics = diagnostics

    def to_dict(self) -> Dict[str, any]:
        return {
            "diagnostics": [d.to_dict() for d in self.diagnostics],
            "count": len(self.diagnostics),
            "errors": sum(1 for d in self.diagnostics if d.severity == "error"),
            "warnings": sum(1 for d in self.diagnostics if d.severity == "warning"),
        }


class LintEngine:
    """Lint ALP files for style conventions and best practices."""

    def lint_file(self, filepath: str) -> LintResult:
        diagnostics: List[LintDiagnostic] = []
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        self._check_content(content, filepath, diagnostics)
        return LintResult(diagnostics=diagnostics)

    def lint_directory(self, dirpath: str) -> LintResult:
        all_diagnostics: List[LintDiagnostic] = []
        for root, _, files in os.walk(dirpath):
            for filename in files:
                if not filename.endswith(".alp"):
                    continue
                full_path = os.path.join(root, filename)
                result = self.lint_file(full_path)
                all_diagnostics.extend(result.diagnostics)
        return LintResult(diagnostics=all_diagnostics)

    def _check_content(self, content: str, source: str, diagnostics: List[LintDiagnostic]) -> None:
        lines = content.split("\n")
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if not stripped:
                continue
            if stripped.startswith("@"):
                continue
            if stripped.startswith("id:"):
                continue
            if "  " in stripped:
                diagnostics.append(LintDiagnostic(
                    file=source,
                    message=f"Line {i}: multiple spaces detected",
                    severity="warning",
                ))
                break
