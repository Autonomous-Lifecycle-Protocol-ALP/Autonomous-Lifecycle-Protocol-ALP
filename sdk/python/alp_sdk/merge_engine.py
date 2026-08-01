from __future__ import annotations

import os
from typing import Dict, List, Optional


class MergeResult:
    """Result of a merge operation."""

    def __init__(self, source_file: str, target_file: str, merged_count: int, merged_ids: List[str]):
        self.source_file = source_file
        self.target_file = target_file
        self.merged_count = merged_count
        self.merged_ids = merged_ids

    def to_dict(self) -> Dict[str, any]:
        return {
            "source_file": self.source_file,
            "target_file": self.target_file,
            "merged_count": self.merged_count,
            "merged_ids": self.merged_ids,
        }


class MergeEngine:
    """Merge objects from a source ALP file into a target ALP file."""

    def merge(self, workspace_path: str, source_file: str, target_file: str, overwrite: bool = False) -> MergeResult:
        alp_dir = os.path.join(workspace_path, ".alp")
        source_path = os.path.join(alp_dir, source_file)
        target_path = os.path.join(alp_dir, target_file)

        if not os.path.exists(source_path):
            raise FileNotFoundError(f"Source file '{source_file}' not found in {alp_dir}")
        if not os.path.exists(target_path):
            raise FileNotFoundError(f"Target file '{target_file}' not found in {alp_dir}")

        source_objects = self._parse_file(source_path)
        target_objects = self._parse_file(target_path)
        target_ids = {obj.get('id') for obj in target_objects if obj.get('id')}

        merged_ids: List[str] = []
        if overwrite:
            merged_objects = source_objects
            merged_ids = [obj.get('id') for obj in merged_objects if obj.get('id')]
        else:
            merged_objects = [obj for obj in source_objects if not obj.get('id') or obj.get('id') not in target_ids]
            merged_ids = [obj.get('id') for obj in merged_objects if obj.get('id')]

        if not merged_objects:
            return MergeResult(source_file=source_path, target_file=target_path, merged_count=0, merged_ids=[])

        target_objects.extend(merged_objects)
        self._write_file(target_path, target_objects)

        return MergeResult(source_file=source_path, target_file=target_path, merged_count=len(merged_ids), merged_ids=merged_ids)

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
