from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Optional


class InspectResult:
    """Result of inspecting an ALP object."""

    def __init__(self, object_id: str, object_type: str, file: str, properties: Dict[str, Any]):
        self.object_id = object_id
        self.object_type = object_type
        self.file = file
        self.properties = properties

    def to_dict(self) -> Dict[str, Any]:
        return {
            "object_id": self.object_id,
            "object_type": self.object_type,
            "file": self.file,
            "properties": self.properties,
        }


class InspectEngine:
    """Inspect a specific ALP object and return its properties."""

    PROPERTY_ORDER = [
        'description', 'status', 'agent', 'depends_on', 'references', 'links',
        'from', 'to', 'on_violation', 'enforcement', 'cron', 'at',
        'recipients', 'algorithm', 'capabilities', 'model', 'steps', 'triggers', 'rules'
    ]

    def inspect(self, workspace_path: str, object_id: str, file: Optional[str] = None) -> InspectResult:
        alp_dir = os.path.join(workspace_path, ".alp")
        if not os.path.isdir(alp_dir):
            raise FileNotFoundError(f".alp directory not found in {workspace_path}")

        target_file = file or self._find_file(alp_dir, object_id)
        if not target_file:
            raise FileNotFoundError(f"Object '{object_id}' not found in {workspace_path}")

        with open(target_file, 'r', encoding='utf-8') as f:
            content = f.read()

        obj = self._parse_object(content, object_id)
        if not obj:
            raise FileNotFoundError(f"Object '{object_id}' not found in {target_file}")

        properties = self._extract_properties(obj)
        return InspectResult(
            object_id=object_id,
            object_type=obj.get('_type', 'unknown'),
            file=target_file,
            properties=properties,
        )

    def _find_file(self, alp_dir: str, object_id: str) -> Optional[str]:
        files = [f for f in os.listdir(alp_dir) if f.endswith('.alp')]
        for filename in files:
            full_path = os.path.join(alp_dir, filename)
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            if f"id: {object_id}" in content:
                return full_path
        return None

    def _parse_object(self, content: str, object_id: str) -> Optional[Dict[str, Any]]:
        lines = content.split('\n')
        current_type: Optional[str] = None
        current_id: Optional[str] = None
        properties: Dict[str, Any] = {}

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            type_match = re.match(r'^@(\w+)', stripped)
            if type_match:
                if current_id == object_id:
                    return {'_type': current_type, 'id': current_id, **properties}
                current_type = type_match.group(1)
                current_id = None
                properties = {}
                continue

            id_match = re.match(r'^id:\s*(\S+)', stripped)
            if id_match:
                current_id = id_match.group(1)
                continue

            if current_id != object_id:
                continue

            prop_match = re.match(r'^(\w+):\s*(.+)', stripped)
            if prop_match:
                key, value = prop_match.group(1), prop_match.group(2).strip()
                properties[key] = self._parse_value(value)

        if current_id == object_id:
            return {'_type': current_type, 'id': current_id, **properties}
        return None

    def _parse_value(self, value: str) -> Any:
        if value.startswith('[') and value.endswith(']'):
            inner = value[1:-1].strip()
            if not inner:
                return value
            if ',' in inner:
                return [item.strip().strip('"').strip("'") for item in inner.split(',')]
            return value
        if value.startswith('"') and value.endswith('"'):
            return value[1:-1]
        if value.startswith("'") and value.endswith("'"):
            return value[1:-1]
        return value

    def _extract_properties(self, obj: Dict[str, Any]) -> Dict[str, Any]:
        result: Dict[str, Any] = {}
        for key in self.PROPERTY_ORDER:
            if key in obj:
                result[key] = obj[key]
        for key, value in obj.items():
            if key not in ('_type', 'id') and key not in result:
                result[key] = value
        return result
