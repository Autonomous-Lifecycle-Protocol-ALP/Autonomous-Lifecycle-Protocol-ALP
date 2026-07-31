from __future__ import annotations

import os
import re
from typing import Dict, List, Optional


class SearchResult:
    """Result of a workspace search."""

    def __init__(self, object_id: str, object_type: str, file: str, description: str = ''):
        self.object_id = object_id
        self.object_type = object_type
        self.file = file
        self.description = description

    def to_dict(self) -> Dict[str, str]:
        return {
            "object_id": self.object_id,
            "object_type": self.object_type,
            "file": self.file,
            "description": self.description,
        }


class SearchEngine:
    """Search ALP objects across workspace files by id, description, or regex."""

    def search(self, workspace_path: str, query: str, object_type: Optional[str] = None, regex: bool = False) -> List[SearchResult]:
        alp_dir = os.path.join(workspace_path, ".alp")
        if not os.path.isdir(alp_dir):
            raise FileNotFoundError(f".alp directory not found in {workspace_path}")

        results: List[SearchResult] = []
        files = [f for f in os.listdir(alp_dir) if f.endswith('.alp')]

        for filename in files:
            full_path = os.path.join(alp_dir, filename)
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()

            self._scan_file(content, query, object_type, regex, filename, results)

        return results

    def _scan_file(self, content: str, query: str, object_type: Optional[str], regex: bool, filename: str, results: List[SearchResult]) -> None:
        lines = content.split('\n')
        current_id: Optional[str] = None
        current_type: Optional[str] = None
        current_desc: str = ''

        def evaluate() -> None:
            if current_id is None or current_type is None:
                return
            if object_type and current_type != object_type:
                return
            match = False
            if regex:
                try:
                    pattern = re.compile(query, re.IGNORECASE)
                    match = bool(pattern.search(current_id)) or bool(pattern.search(current_desc))
                except re.error:
                    match = False
            else:
                q = query.lower()
                match = (current_id and q in current_id.lower()) or (q in current_desc.lower())
            if match:
                results.append(SearchResult(
                    object_id=current_id,
                    object_type=current_type,
                    file=filename,
                    description=current_desc,
                ))

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            type_match = re.match(r'^@(\w+)', stripped)
            if type_match:
                evaluate()
                current_type = type_match.group(1)
                current_id = None
                current_desc = ''
                continue

            id_match = re.match(r'^id:\s*(\S+)', stripped)
            if id_match:
                current_id = id_match.group(1)
                continue

            desc_match = re.match(r'^description:\s*"?([^"\n]*)"?', stripped)
            if desc_match:
                current_desc = desc_match.group(1).strip()
                continue

        evaluate()
