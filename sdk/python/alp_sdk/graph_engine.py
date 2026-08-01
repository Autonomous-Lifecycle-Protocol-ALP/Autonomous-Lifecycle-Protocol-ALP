from __future__ import annotations

import os
from typing import Dict, List, Optional


class GraphNode:
    """Represents a node in the dependency graph."""

    def __init__(self, id: str, type: str, dependencies: List[str] = None):
        self.id = id
        self.type = type
        self.dependencies = dependencies or []

    def to_dict(self) -> Dict[str, any]:
        return {
            "id": self.id,
            "type": self.type,
            "dependencies": self.dependencies,
        }


class GraphResult:
    """Result of a graph build operation."""

    def __init__(self, nodes: List[GraphNode], cycles: List[List[str]] = None):
        self.nodes = nodes
        self.cycles = cycles or []

    @property
    def count(self) -> int:
        return len(self.nodes)

    def to_dict(self) -> Dict[str, any]:
        return {
            "nodes": [n.to_dict() for n in self.nodes],
            "cycles": self.cycles,
            "count": self.count,
        }


class GraphEngine:
    """Build dependency graphs from ALP objects."""

    def build_file(self, filepath: str) -> GraphResult:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        objects = self._parse_objects(content)
        return self._build_graph(objects)

    def build_directory(self, dirpath: str) -> GraphResult:
        all_objects: List[Dict[str, any]] = []
        for root, _, files in os.walk(dirpath):
            for filename in files:
                if not filename.endswith(".alp"):
                    continue
                full_path = os.path.join(root, filename)
                with open(full_path, "r", encoding="utf-8") as f:
                    content = f.read()
                all_objects.extend(self._parse_objects(content))
        return self._build_graph(all_objects)

    def _parse_objects(self, content: str) -> List[Dict[str, any]]:
        objects: List[Dict[str, any]] = []
        lines = content.split("\n")
        current: Dict[str, any] = {}
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            type_match = __import__('re').match(r'^@(\w+)', stripped)
            if type_match:
                if current:
                    objects.append(current)
                current = {"_type": type_match.group(1)}
                continue
            id_match = __import__('re').match(r'^id:\s*(\S+)', stripped)
            if id_match:
                current["id"] = id_match.group(1)
            dep_match = __import__('re').match(r'^depends_on:\s*\[(.+)\]', stripped)
            if dep_match:
                deps = [d.strip() for d in dep_match.group(1).split(",") if d.strip()]
                current["depends_on"] = deps
        if current:
            objects.append(current)
        return objects

    def _build_graph(self, objects: List[Dict[str, any]]) -> GraphResult:
        nodes: List[GraphNode] = []
        for obj in objects:
            node = GraphNode(
                id=obj.get("id", "unknown"),
                type=obj.get("_type", "unknown"),
                dependencies=obj.get("depends_on", []),
            )
            nodes.append(node)
        return GraphResult(nodes=nodes)
