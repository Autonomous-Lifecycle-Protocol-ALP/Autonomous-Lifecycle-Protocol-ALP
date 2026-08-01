from __future__ import annotations

import os
from typing import Dict, List, Optional


class ValidationError:
    """Represents a single validation error."""

    def __init__(self, file: str, message: str, details: Optional[Dict] = None):
        self.file = file
        self.message = message
        self.details = details or {}

    def to_dict(self) -> Dict[str, any]:
        return {
            "file": self.file,
            "message": self.message,
            "details": self.details,
        }


class ValidationResult:
    """Result of a validation operation."""

    def __init__(self, valid: bool, errors: List[ValidationError]):
        self.valid = valid
        self.errors = errors

    def to_dict(self) -> Dict[str, any]:
        return {
            "valid": self.valid,
            "errors": [e.to_dict() for e in self.errors],
            "count": len(self.errors),
        }


class ValidateEngine:
    """Validate ALP files against schemas."""

    def validate_file(self, filepath: str) -> ValidationResult:
        errors: List[ValidationError] = []
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            self._parse_and_validate(content, filepath)
        except Exception as exc:
            errors.append(ValidationError(file=filepath, message=str(exc)))
        return ValidationResult(valid=len(errors) == 0, errors=errors)

    def validate_directory(self, dirpath: str) -> ValidationResult:
        errors: List[ValidationError] = []
        for root, _, files in os.walk(dirpath):
            for filename in files:
                if not filename.endswith(".alp"):
                    continue
                full_path = os.path.join(root, filename)
                result = self.validate_file(full_path)
                errors.extend(result.errors)
        return ValidationResult(valid=len(errors) == 0, errors=errors)

    def _parse_and_validate(self, content: str, source: str) -> None:
        from .reader import AlpParser
        parser = AlpParser()
        parser.parse_and_validate(content)
