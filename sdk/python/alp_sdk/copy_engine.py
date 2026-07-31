from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Optional


class CopyResult:
    """Result of a copy/duplicate operation."""

    def __init__(self, source_id: str, target_id: str, files_updated: int, copies: int):
        self.source_id = source_id
        self.target_id = target_id
        self.files_updated = files_updated
        self.copies = copies

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_id": self.source_id,
            "target_id": self.target_id,
            "files_updated": self.files_updated,
            "copies": self.copies,
        }


class CopyEngine:
    """Duplicate ALP object ids across workspace files."""

    ID_PATTERN = re.compile(r"^(\s*id:\s*)" + re.escape("{source}") + r"(\s*)$")
    REF_FIELDS = ["depends_on", "references", "links", "parent", "child"]

    def copy(self, workspace_path: str, source_id: str, target_id: str, update_refs: bool = False) -> CopyResult:
        alp_dir = os.path.join(workspace_path, ".alp")
        if not os.path.isdir(alp_dir):
            raise FileNotFoundError(f".alp directory not found in {workspace_path}")

        files = [f for f in os.listdir(alp_dir) if f.endswith('.alp')]
        files_updated = 0
        copies = 0

        for filename in files:
            full_path = os.path.join(alp_dir, filename)
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()

            updated, count = self._copy_in_content(content, source_id, target_id, update_refs)

            if count > 0:
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(updated)
                files_updated += 1
                copies += count

        return CopyResult(
            source_id=source_id,
            target_id=target_id,
            files_updated=files_updated,
            copies=copies,
        )

    def _copy_in_content(self, content: str, source_id: str, target_id: str, update_refs: bool) -> tuple[str, int]:
        lines = content.splitlines()
        updated_lines: List[str] = []
        count = 0

        for line in lines:
            stripped = line.lstrip()
            indent = line[: len(line) - len(stripped)]

            if stripped.startswith('id:'):
                match = re.match(r'^id:\s*(.+)$', stripped)
                if match and match.group(1).strip() == source_id:
                    line = f'{indent}id: {target_id}'
                    count += 1
            elif update_refs:
                for field in self.REF_FIELDS:
                    if stripped.startswith(f'{field}:'):
                        match = re.match(rf'^{re.escape(field)}:\s*(.+)$', stripped)
                        if match and match.group(1).strip() == source_id:
                            line = f'{indent}{field}: {target_id}'
                            break

            updated_lines.append(line)

        return '\n'.join(updated_lines), count
