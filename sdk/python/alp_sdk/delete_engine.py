from __future__ import annotations

import os
from typing import Dict, List, Optional


class DeleteResult:
    """Result of a delete operation."""

    def __init__(self, object_id: str, file: str, deleted: bool):
        self.object_id = object_id
        self.file = file
        self.deleted = deleted

    def to_dict(self) -> Dict[str, any]:
        return {
            "object_id": self.object_id,
            "file": self.file,
            "deleted": self.deleted,
        }


class DeleteEngine:
    """Delete an ALP object from a workspace file."""

    def delete(self, workspace_path: str, object_id: str, file: Optional[str] = None) -> DeleteResult:
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
        block_start = -1
        block_end = len(lines)
        for i, line in enumerate(lines):
            if line.strip().startswith('id:') and line.split(':', 1)[1].strip() == object_id:
                block_start = i - 1
                while block_start >= 0 and not lines[block_start].strip().startswith('@'):
                    block_start -= 1
                block_start = max(0, block_start)
                block_end = i + 1
                while block_end < len(lines) and not lines[block_end].strip().startswith('@'):
                    block_end += 1
                break

        if block_start == -1:
            raise FileNotFoundError(f"Object '{object_id}' not found in {target_file}")

        updated = lines[:block_start] + lines[block_end:]
        updated = [l for l in updated if l.strip()]

        with open(target_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(updated) + '\n')

        return DeleteResult(object_id=object_id, file=target_file, deleted=True)

    def _find_file(self, alp_dir: str, object_id: str) -> Optional[str]:
        files = [f for f in os.listdir(alp_dir) if f.endswith('.alp')]
        for filename in files:
            full_path = os.path.join(alp_dir, filename)
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            if f"id: {object_id}" in content:
                return full_path
        return None
