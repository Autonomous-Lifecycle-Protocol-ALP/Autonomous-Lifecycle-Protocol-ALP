from __future__ import annotations

import os
from typing import Dict, List, Optional


class DeduplicateResult:
    """Result of a deduplicate operation."""

    def __init__(self, removed_count: int, removed_ids: List[str]):
        self.removed_count = removed_count
        self.removed_ids = removed_ids

    def to_dict(self) -> Dict[str, any]:
        return {
            "removed_count": self.removed_count,
            "removed_ids": self.removed_ids,
        }


class DeduplicateEngine:
    """Remove duplicate ALP objects from workspace files."""

    def deduplicate(self, workspace_path: str) -> DeduplicateResult:
        alp_dir = os.path.join(workspace_path, ".alp")
        if not os.path.isdir(alp_dir):
            raise FileNotFoundError(f".alp directory not found in {workspace_path}")

        files = sorted([f for f in os.listdir(alp_dir) if f.endswith('.alp')])
        seen = {}
        removed_ids: List[str] = []
        total_removed = 0

        for filename in files:
            full_path = os.path.join(alp_dir, filename)
            objects = self._parse_file(full_path)
            keep = []
            for obj in objects:
                obj_id = obj.get('id')
                if not obj_id:
                    keep.append(obj)
                    continue
                if obj_id in seen:
                    total_removed += 1
                    removed_ids.append(obj_id)
                else:
                    seen[obj_id] = full_path
                    keep.append(obj)

            self._write_file(full_path, keep)

        return DeduplicateResult(removed_count=total_removed, removed_ids=removed_ids)

    def _parse_file(self, filepath: str) -> List[Dict[str, any]]:
        objects: List[Dict[str, any]] = []
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        lines = content.split('\n')
        current_obj: Dict[str, any] = {}
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            type_match = __import__('re').match(r'^@(\w+)', stripped)
            if type_match:
                if current_obj:
                    objects.append(current_obj)
                current_obj = {'_type': type_match.group(1)}
                continue
            id_match = __import__('re').match(r'^id:\s*(\S+)', stripped)
            if id_match:
                current_obj['id'] = id_match.group(1)
                continue
            prop_match = __import__('re').match(r'^(\w+):\s*(.+)', stripped)
            if prop_match:
                current_obj[prop_match.group(1)] = prop_match.group(2).strip()

        if current_obj:
            objects.append(current_obj)
        return objects

    def _write_file(self, filepath: str, objects: List[Dict[str, any]]) -> None:
        lines: List[str] = []
        for obj in objects:
            lines.append(f"@{obj.get('_type', 'object')}")
            for key, value in obj.items():
                if key == '_type':
                    continue
                if value is None or value == '':
                    continue
                if isinstance(value, list):
                    items = ', '.join(f'"{v}"' if isinstance(v, str) else str(v) for v in value)
                    lines.append(f"  {key}: [{items}]")
                else:
                    lines.append(f"  {key}: {value}")
            lines.append('')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines) + '\n')
