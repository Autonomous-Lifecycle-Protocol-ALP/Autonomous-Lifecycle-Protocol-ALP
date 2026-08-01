from __future__ import annotations

import os
import re
from typing import Dict, List, Optional


class PromoteResult:
    """Result of a promote operation."""

    def __init__(self, object_id: str, old_type: str, new_type: str, file: str):
        self.object_id = object_id
        self.old_type = old_type
        self.new_type = new_type
        self.file = file

    def to_dict(self) -> Dict[str, any]:
        return {
            "object_id": self.object_id,
            "old_type": self.old_type,
            "new_type": self.new_type,
            "file": self.file,
        }


class PromoteEngine:
    """Promote an ALP object from one type to another."""

    def promote(self, workspace_path: str, object_id: str, new_type: str, file: Optional[str] = None) -> PromoteResult:
        alp_dir = os.path.join(workspace_path, ".alp")
        if not os.path.isdir(alp_dir):
            raise FileNotFoundError(f".alp directory not found in {workspace_path}")

        target_file = file or self._find_file(alp_dir, object_id)
        if not target_file:
            raise FileNotFoundError(f"Object '{object_id}' not found in {workspace_path}")

        with open(target_file, 'r', encoding='utf-8') as f:
            content = f.read()

        if f"id: {object_id}" not in content:
            raise FileNotFoundError(f"Object '{object_id}' not found in {target_file}")

        lines = content.split('\n')
        object_start = -1
        object_end = len(lines)
        current_id = None
        old_type = None

        for i, line in enumerate(lines):
            stripped = line.strip()
            type_match = re.match(r'^@(\w+)', stripped)
            if type_match:
                if current_id == object_id:
                    object_end = i
                    break
                current_id = None
                object_start = i
                old_type = type_match.group(1)
            id_match = re.match(r'^id:\s*(\S+)', stripped)
            if id_match:
                current_id = id_match.group(1)

        if current_id != object_id:
            raise FileNotFoundError(f"Object '{object_id}' not found in {target_file}")

        lines[object_start] = f"@{new_type}"
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines) + '\n')

        return PromoteResult(object_id=object_id, old_type=old_type or 'unknown', new_type=new_type, file=target_file)

    def _find_file(self, alp_dir: str, object_id: str) -> Optional[str]:
        files = [f for f in os.listdir(alp_dir) if f.endswith('.alp')]
        for filename in files:
            full_path = os.path.join(alp_dir, filename)
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            if f"id: {object_id}" in content:
                return full_path
        return None
