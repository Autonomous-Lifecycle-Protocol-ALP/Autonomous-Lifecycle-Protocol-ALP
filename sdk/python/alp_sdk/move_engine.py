from __future__ import annotations

import os
import re
from typing import Optional


class MoveResult:
    """Result of a move operation."""

    def __init__(self, object_id: str, source_file: str, target_file: str):
        self.object_id = object_id
        self.source_file = source_file
        self.target_file = target_file

    def to_dict(self) -> dict:
        return {
            "object_id": self.object_id,
            "source_file": self.source_file,
            "target_file": self.target_file,
        }


class MoveEngine:
    """Move ALP objects between files within a workspace."""

    OBJECT_PATTERN = re.compile(r'^(@\w+)\s*(?=\n|$)', re.MULTILINE)

    def move(self, workspace_path: str, object_id: str, target_filename: str) -> MoveResult:
        alp_dir = os.path.join(workspace_path, ".alp")
        if not os.path.isdir(alp_dir):
            raise FileNotFoundError(f".alp directory not found in {workspace_path}")

        if not target_filename.endswith('.alp'):
            raise ValueError(f"Target file must have .alp extension: {target_filename}")

        source_path = None
        object_block = None

        for filename in os.listdir(alp_dir):
            if not filename.endswith('.alp'):
                continue
            full_path = os.path.join(alp_dir, filename)
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()

            block = self._extract_block(content, object_id)
            if block is not None:
                source_path = full_path
                object_block = block
                break

        if source_path is None:
            raise FileNotFoundError(f"Object '{object_id}' not found in {workspace_path}")

        target_path = os.path.join(alp_dir, target_filename)
        if not os.path.exists(target_path):
            with open(target_path, 'w', encoding='utf-8') as f:
                f.write('')

        with open(target_path, 'r', encoding='utf-8') as f:
            target_content = f.read()

        if target_content and not target_content.endswith('\n'):
            target_content += '\n'
        target_content += object_block + '\n'

        with open(target_path, 'w', encoding='utf-8') as f:
            f.write(target_content)

        with open(source_path, 'r', encoding='utf-8') as f:
            source_content = f.read()

        source_content = source_content.replace(object_block, '').strip()
        with open(source_path, 'w', encoding='utf-8') as f:
            f.write(source_content + '\n')

        return MoveResult(
            object_id=object_id,
            source_file=os.path.basename(source_path),
            target_file=target_filename,
        )

    def _extract_block(self, content: str, object_id: str) -> Optional[str]:
        lines = content.split('\n')
        start = -1
        for i, line in enumerate(lines):
            match = re.match(r'^(@\w+)', line)
            if match:
                block_text = '\n'.join(lines[i:i + 20])
                id_match = re.search(r'id:\s*(\S+)', block_text)
                if id_match and id_match.group(1) == object_id:
                    start = i
                    break

        if start == -1:
            return None

        end = start + 1
        while end < len(lines) and not re.match(r'^(@\w+)', lines[end]):
            end += 1

        return '\n'.join(lines[start:end])
