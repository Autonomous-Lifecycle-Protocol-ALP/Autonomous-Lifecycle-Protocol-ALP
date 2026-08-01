from __future__ import annotations

import os
from typing import Dict, List, Optional


class WorkflowDiagram:
    """Represents a generated workflow diagram."""

    def __init__(self, workflow_id: str, format: str, content: str):
        self.workflow_id = workflow_id
        self.format = format
        self.content = content

    def to_dict(self) -> Dict[str, any]:
        return {
            "workflow_id": self.workflow_id,
            "format": self.format,
            "content": self.content,
        }


class VisualizeEngine:
    """Generate diagrams from @workflow objects."""

    def visualize_file(self, filepath: str, format: str = "mermaid") -> List[WorkflowDiagram]:
        diagrams: List[WorkflowDiagram] = []
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        workflows = self._parse_workflows(content)
        for workflow in workflows:
            diagram = self._generate_diagram(workflow, format)
            diagrams.append(diagram)
        return diagrams

    def visualize_directory(self, dirpath: str, format: str = "mermaid") -> List[WorkflowDiagram]:
        diagrams: List[WorkflowDiagram] = []
        for root, _, files in os.walk(dirpath):
            for filename in files:
                if not filename.endswith(".alp"):
                    continue
                full_path = os.path.join(root, filename)
                diagrams.extend(self.visualize_file(full_path, format=format))
        return diagrams

    def _parse_workflows(self, content: str) -> List[Dict[str, any]]:
        workflows: List[Dict[str, any]] = []
        lines = content.split("\n")
        current: Dict[str, any] = {}
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("@workflow"):
                if current:
                    workflows.append(current)
                current = {"_type": "workflow", "steps": []}
                continue
            if stripped.startswith("id:"):
                current["id"] = stripped.split(":", 1)[1].strip()
            elif stripped.startswith("steps:"):
                steps_str = stripped.split(":", 1)[1].strip()
                current["steps"] = [s.strip() for s in steps_str.split(",") if s.strip()]
        if current:
            workflows.append(current)
        return workflows

    def _generate_diagram(self, workflow: Dict[str, any], format: str) -> WorkflowDiagram:
        workflow_id = workflow.get("id", "unknown")
        steps = workflow.get("steps", [])
        if format == "mermaid":
            content = "graph TD\n"
            for i, step in enumerate(steps):
                content += f"  {i+1}[{step}]\n"
                if i > 0:
                    content += f"  {i}[{steps[i-1]}] --> {i+1}[{step}]\n"
        elif format == "dot":
            content = "digraph {\n"
            for i, step in enumerate(steps):
                content += f'  {i+1} [label="{step}"]\n'
                if i > 0:
                    content += f"  {i} -> {i+1}\n"
            content += "}\n"
        else:
            content = str(workflow)
        return WorkflowDiagram(workflow_id=workflow_id, format=format, content=content)
