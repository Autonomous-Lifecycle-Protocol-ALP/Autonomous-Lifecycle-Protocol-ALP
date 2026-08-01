from __future__ import annotations

import os
from typing import Dict, List, Optional


class ListResult:
    """Result of a list operation."""

    def __init__(self, objects: List[Dict[str, str]]):
        self.objects = objects

    def to_dict(self) -> Dict[str, any]:
        return {
            "objects": self.objects,
            "count": len(self.objects),
        }


class ListEngine:
    """List all ALP objects in the workspace."""

    def list(self, workspace_path: str, type_filter: Optional[str] = None) -> ListResult:
        alp_dir = os.path.join(workspace_path, ".alp")
        if not os.path.isdir(alp_dir):
            raise FileNotFoundError(f".alp directory not found in {workspace_path}")

        files = [f for f in os.listdir(alp_dir) if f.endswith('.alp')]
        objects: List[Dict[str, str]] = []

        for filename in files:
            full_path = os.path.join(alp_dir, filename)
            file_objects = self._parse_file(full_path)
            for obj in file_objects:
                obj_type = obj.get('_type', 'unknown')
                if type_filter and obj_type != type_filter:
                    continue
                objects.append({
                    "id": obj.get('id', '(no id)'),
                    "type": obj_type,
                    "file": filename,
                })

        return ListResult(objects=objects)

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
