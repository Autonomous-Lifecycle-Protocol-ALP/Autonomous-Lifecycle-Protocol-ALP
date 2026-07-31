from __future__ import annotations

import os
import re
from typing import Dict, List, Optional, Set, Tuple


class DependencyResult:
    """Result of a dependency inspection."""

    def __init__(self, object_id: str):
        self.object_id = object_id
        self.depends_on: List[str] = []
        self.depended_by: List[str] = []

    def to_dict(self) -> Dict[str, any]:
        return {
            "object_id": self.object_id,
            "depends_on": self.depends_on,
            "depended_by": self.depended_by,
        }


class DependencyEngine:
    """Inspect dependencies between ALP objects across workspace files."""

    REF_FIELDS = {'depends_on', 'references', 'links', 'parent', 'child', 'extends', 'implements', 'uses'}

    def inspect(self, workspace_path: str, object_id: str) -> DependencyResult:
        alp_dir = os.path.join(workspace_path, ".alp")
        if not os.path.isdir(alp_dir):
            raise FileNotFoundError(f".alp directory not found in {workspace_path}")

        result = DependencyResult(object_id=object_id)
        files = [f for f in os.listdir(alp_dir) if f.endswith('.alp')]
        found = False

        for filename in files:
            full_path = os.path.join(alp_dir, filename)
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()

            if self._scan_file(content, object_id, result):
                found = True

        if not found:
            raise FileNotFoundError(f"Object '{object_id}' not found in {workspace_path}")

        return result

    def _scan_file(self, content: str, object_id: str, result: DependencyResult) -> bool:
        lines = content.split('\n')
        current_id: Optional[str] = None
        found = False

        for line in lines:
            id_match = re.match(r'^\s*id:\s*(\S+)', line)
            if id_match:
                current_id = id_match.group(1)
                if current_id == object_id:
                    found = True

            if current_id is None:
                continue

            ref_match = re.match(r'^\s*(\w+):\s*(\S+)', line)
            if ref_match:
                field, value = ref_match.group(1), ref_match.group(2)
                if field in self.REF_FIELDS:
                    if current_id == object_id:
                        result.depends_on.append(f"{field}: {value}")
                    elif value == object_id:
                        result.depended_by.append(current_id)

        return found
