from __future__ import annotations

import os
from typing import Dict, List, Optional


class FormatResult:
    """Result of a format operation."""

    def __init__(self, changed: int, checked: int, files: List[str]):
        self.changed = changed
        self.checked = checked
        self.files = files

    def to_dict(self) -> Dict[str, any]:
        return {
            "changed": self.changed,
            "checked": self.checked,
            "files": self.files,
        }


class FormatEngine:
    """Format ALP files with consistent indentation and style."""

    def format_file(self, filepath: str, check: bool = False) -> FormatResult:
        changed_files: List[str] = []
        with open(filepath, "r", encoding="utf-8") as f:
            original = f.read()
        formatted = self._format_content(original)
        if original != formatted:
            changed_files.append(filepath)
            if not check:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(formatted)
        return FormatResult(changed=len(changed_files), checked=1, files=changed_files)

    def format_directory(self, dirpath: str, check: bool = False) -> FormatResult:
        changed_files: List[str] = []
        checked = 0
        for root, _, files in os.walk(dirpath):
            for filename in files:
                if not filename.endswith(".alp"):
                    continue
                full_path = os.path.join(root, filename)
                result = self.format_file(full_path, check=check)
                checked += result.checked
                changed_files.extend(result.files)
        return FormatResult(changed=len(changed_files), checked=checked, files=changed_files)

    def _format_content(self, content: str) -> str:
        lines = content.split("\n")
        formatted_lines: List[str] = []
        indent_level = 0
        for line in lines:
            stripped = line.strip()
            if not stripped:
                formatted_lines.append("")
                continue
            if stripped.startswith("@"):
                indent_level = 0
            elif stripped.startswith("id:") or stripped.startswith("description:"):
                indent_level = 1
            formatted = "  " * indent_level + stripped
            formatted_lines.append(formatted)
            if stripped.endswith(":"):
                indent_level += 1
        return "\n".join(formatted_lines)
