"""ALP Linter (v42.0.0 IDE Quality)"""

import os
from dataclasses import dataclass
from typing import List, Optional, Callable, Dict, Any


@dataclass
class LintDiagnostic:
    rule: str
    severity: str
    message: str
    file: str
    line: Optional[int] = None
    object_id: Optional[str] = None


@dataclass
class LintRule:
    name: str
    description: str
    severity: str
    check: Callable[[Dict[str, Any], str], Optional[LintDiagnostic]]


class Linter:
    def __init__(self):
        from .reader import AlpParser
        self.parser = AlpParser()
        self.rules: List[LintRule] = self._default_rules()

    def add_rule(self, rule: LintRule):
        self.rules.append(rule)

    def lint_file(self, file_path: str) -> List[LintDiagnostic]:
        diagnostics: List[LintDiagnostic] = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            objects = self.parser.parse(content)
            for obj in objects:
                for rule in self.rules:
                    result = rule.check(obj, file_path)
                    if result:
                        diagnostics.append(result)
        except Exception:
            pass
        return diagnostics

    def lint_directory(self, directory: str) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        if not os.path.exists(directory):
            return results

        def walk(current: str):
            for entry in os.listdir(current):
                full_path = os.path.join(current, entry)
                if os.path.isdir(full_path):
                    walk(full_path)
                elif entry.endswith('.alp'):
                    diagnostics = self.lint_file(full_path)
                    if diagnostics:
                        results.append({'file': full_path, 'diagnostics': diagnostics})

        walk(directory)
        return results

    def get_rules(self) -> List[LintRule]:
        return list(self.rules)

    def _default_rules(self) -> List[LintRule]:
        return [
            LintRule(
                name='kebab-case-id',
                description='Object IDs must be kebab-case',
                severity='error',
                check=lambda obj, file: (
                    LintDiagnostic(
                        rule='kebab-case-id',
                        severity='error',
                        message=f"ID '{obj.get('id', '(missing)')}' is not kebab-case",
                        file=file,
                        object_id=obj.get('id'),
                    )
                    if not obj.get('id') or not __import__('re').match(r'^[a-z0-9-]+$', obj.get('id', ''))
                    else None
                ),
            ),
            LintRule(
                name='required-description',
                description='Objects should have a description',
                severity='warning',
                check=lambda obj, file: (
                    LintDiagnostic(
                        rule='required-description',
                        severity='warning',
                        message=f"Missing description on {obj.get('_type')}",
                        file=file,
                        object_id=obj.get('id'),
                    )
                    if not obj.get('description')
                    else None
                ),
            ),
            LintRule(
                name='description-length',
                description='Descriptions should be at least 15 characters',
                severity='warning',
                check=lambda obj, file: (
                    LintDiagnostic(
                        rule='description-length',
                        severity='warning',
                        message='Description is too short (<15 chars)',
                        file=file,
                        object_id=obj.get('id'),
                    )
                    if obj.get('description') and len(obj.get('description', '')) < 15
                    else None
                ),
            ),
            LintRule(
                name='task-verify',
                description='Tasks should define verify quality gates',
                severity='warning',
                check=lambda obj, file: (
                    LintDiagnostic(
                        rule='task-verify',
                        severity='warning',
                        message="Task has no verify quality gates defined",
                        file=file,
                        object_id=obj.get('id'),
                    )
                    if obj.get('_type') == 'task' and not obj.get('verify')
                    else None
                ),
            ),
        ]
