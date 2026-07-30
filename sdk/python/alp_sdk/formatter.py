"""ALP Formatter (v42.0.0 IDE Quality)"""

import os
from dataclasses import dataclass
from typing import List, Dict, Any, Optional


@dataclass
class FormatOptions:
    indent_size: int = 2
    preserve_comments: bool = True


@dataclass
class FormatResult:
    file: str
    formatted: bool


class AlpFormatter:
    def __init__(self, options: Optional[FormatOptions] = None):
        self.indent_size = (options.indent_size if options else 2)

    def format(self, content: str) -> str:
        lines = content.split('\n')
        formatted: List[str] = []
        in_directive = False
        object_indent = 0

        for line in lines:
            trimmed = line.strip()

            if trimmed == '':
                formatted.append('')
                continue

            if trimmed.startswith('!'):
                formatted.append(trimmed)
                in_directive = True
                continue

            if in_directive:
                formatted.append(trimmed)
                in_directive = False
                continue

            if trimmed.startswith('@'):
                formatted.append(trimmed)
                object_indent = 1
                continue

            if trimmed.startswith('[') or trimmed.startswith('<-'):
                formatted.append(self._indent(object_indent + 1) + trimmed)
                continue

            if ':' in trimmed:
                key, *rest = trimmed.split(':')
                value = ':'.join(rest).strip()
                if value == '':
                    formatted.append(self._indent(object_indent + 1) + trimmed)
                elif value.startswith('[') or value.startswith('<-') or value.startswith('@'):
                    formatted.append(self._indent(object_indent + 1) + trimmed)
                else:
                    formatted.append(self._indent(object_indent + 1) + f'{key}: {value}')
                continue

            formatted.append(self._indent(object_indent + 1) + trimmed)

        return '\n'.join(formatted)

    def format_file(self, file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return self.format(content)

    def format_workspace(self, alp_dir: str) -> List[FormatResult]:
        results: List[FormatResult] = []
        if not os.path.exists(alp_dir):
            return results

        def walk(directory: str):
            for entry in os.listdir(directory):
                full_path = os.path.join(directory, entry)
                if os.path.isdir(full_path):
                    walk(full_path)
                elif entry.endswith('.alp'):
                    original = self.format_file(full_path)
                    formatted = self.format(original)
                    changed = original != formatted
                    if changed:
                        with open(full_path, 'w', encoding='utf-8') as f:
                            f.write(formatted)
                    results.append(FormatResult(file=full_path, formatted=changed))

        walk(alp_dir)
        return results

    def _indent(self, level: int) -> str:
        return ' ' * (self.indent_size * level)
