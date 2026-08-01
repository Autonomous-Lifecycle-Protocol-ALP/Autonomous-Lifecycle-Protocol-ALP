from __future__ import annotations

import os
from typing import Dict, List, Optional


class ArchiveResult:
    """Result of an archive operation."""

    def __init__(self, status: str, archived_count: int, archived_ids: List[str], archive_file: str):
        self.status = status
        self.archived_count = archived_count
        self.archived_ids = archived_ids
        self.archive_file = archive_file

    def to_dict(self) -> Dict[str, any]:
        return {
            "status": self.status,
            "archived_count": self.archived_count,
            "archived_ids": self.archived_ids,
            "archive_file": self.archive_file,
        }


class ArchiveEngine:
    """Move objects with a given status to an archive file."""

    def archive(self, workspace_path: str, status: str) -> ArchiveResult:
        alp_dir = os.path.join(workspace_path, ".alp")
        if not os.path.isdir(alp_dir):
            raise FileNotFoundError(f".alp directory not found in {workspace_path}")

        archive_path = os.path.join(alp_dir, "archive.alp")
        files = [f for f in os.listdir(alp_dir) if f.endswith('.alp') and f != 'archive.alp']
        archived_ids: List[str] = []
        total_archived = 0

        for filename in files:
            full_path = os.path.join(alp_dir, filename)
            objects = self._parse_file(full_path)
            keep = []
            to_archive = []
            for obj in objects:
                if obj.get('status') == status:
                    to_archive.append(obj)
                else:
                    keep.append(obj)

            if to_archive:
                existing = ''
                if os.path.exists(archive_path):
                    with open(archive_path, 'r', encoding='utf-8') as f:
                        existing = f.read()
                new_blocks = [self._format_object(o) for o in to_archive]
                with open(archive_path, 'w', encoding='utf-8') as f:
                    f.write(existing.rstrip('\n') + '\n\n' + '\n\n'.join(new_blocks) + '\n')
                archived_ids.extend([o.get('id') for o in to_archive if o.get('id')])
                total_archived += len(to_archive)
                self._write_file(full_path, keep)

        return ArchiveResult(
            status=status,
            archived_count=total_archived,
            archived_ids=archived_ids,
            archive_file=archive_path,
        )

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

    def _format_object(self, obj: Dict[str, any]) -> str:
        lines = [f"@{obj.get('_type', 'object')}"]
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
        return '\n'.join(lines)

    def _write_file(self, filepath: str, objects: List[Dict[str, any]]) -> None:
        lines = [self._format_object(o) for o in objects]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(lines) + '\n' if lines else '')
