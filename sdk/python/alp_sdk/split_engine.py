from __future__ import annotations

import os
from typing import Dict, List, Optional


class SplitResult:
    """Result of a split operation."""

    def __init__(self, source_file: str, created_files: List[str], total_objects: int):
        self.source_file = source_file
        self.created_files = created_files
        self.total_objects = total_objects

    def to_dict(self) -> Dict[str, any]:
        return {
            "source_file": self.source_file,
            "created_files": self.created_files,
            "total_objects": self.total_objects,
        }


class SplitEngine:
    """Split an ALP file into multiple files by object type."""

    def split(self, workspace_path: str, source_file: str, type_filter: Optional[str] = None) -> SplitResult:
        alp_dir = os.path.join(workspace_path, ".alp")
        source_path = os.path.join(alp_dir, source_file)

        if not os.path.exists(source_path):
            raise FileNotFoundError(f"Source file '{source_file}' not found in {alp_dir}")

        objects = self._parse_file(source_path)
        if not objects:
            return SplitResult(source_file=source_path, created_files=[], total_objects=0)

        groups: Dict[str, List[Dict[str, any]]] = {}
        for obj in objects:
            obj_type = obj.get('_type', 'unknown')
            if type_filter and obj_type != type_filter:
                continue
            groups.setdefault(obj_type, []).append(obj)

        created_files: List[str] = []
        for obj_type, objs in groups.items():
            target_name = f"{obj_type}s.alp"
            target_path = os.path.join(alp_dir, target_name)
            self._write_file(target_path, objs)
            created_files.append(target_name)

        return SplitResult(source_file=source_path, created_files=created_files, total_objects=len(objects))

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
