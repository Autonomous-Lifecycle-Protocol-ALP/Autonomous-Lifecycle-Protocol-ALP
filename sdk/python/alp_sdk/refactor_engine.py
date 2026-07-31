from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional


class RenameResult:
    """Result of a rename/refactor operation."""

    def __init__(self, old_id: str, new_id: str, files_updated: int, replacements: int):
        self.old_id = old_id
        self.new_id = new_id
        self.files_updated = files_updated
        self.replacements = replacements

    def to_dict(self) -> Dict[str, Any]:
        return {
            "old_id": self.old_id,
            "new_id": self.new_id,
            "files_updated": self.files_updated,
            "replacements": self.replacements,
        }


class RefactorEngine:
    """Rename ALP object ids across workspace files."""

    ID_PATTERN = re.compile(r"^(\s*id:\s*)")
    REF_PATTERN = re.compile(r"(\s+)(\w+):\s*" + re.escape("{old}") + r"(?=\s|$)")

    def rename(self, workspace_path: str, old_id: str, new_id: str) -> RenameResult:
        alp_dir = os.path.join(workspace_path, ".alp")
        if not os.path.isdir(alp_dir):
            raise FileNotFoundError(f".alp directory not found in {workspace_path}")

        files = [f for f in os.listdir(alp_dir) if f.endswith(".alp")]
        files_updated = 0
        replacements = 0

        for filename in files:
            full_path = os.path.join(alp_dir, filename)
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()

            updated, count = self._rename_in_text(content, old_id, new_id)

            if count > 0:
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(updated)
                files_updated += 1
                replacements += count

        return RenameResult(
            old_id=old_id,
            new_id=new_id,
            files_updated=files_updated,
            replacements=replacements,
        )

    def _rename_in_text(self, content: str, old_id: str, new_id: str) -> tuple[str, int]:
        lines = content.splitlines()
        updated_lines: List[str] = []
        count = 0

        for line in lines:
            stripped = line.lstrip()
            indent = line[: len(line) - len(stripped)]

            if stripped.startswith("id:"):
                match = re.match(r"^id:\s*(.+)$", stripped)
                if match and match.group(1).strip() == old_id:
                    line = f"{indent}id: {new_id}"
                    count += 1

            updated_lines.append(line)

        return "\n".join(updated_lines), count
