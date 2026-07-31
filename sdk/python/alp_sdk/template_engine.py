from __future__ import annotations

import os
from typing import Dict, Optional


class TemplateEngine:
    """Create new ALP objects from built-in templates."""

    TEMPLATES: Dict[str, str] = {
        "task": """@task
  id: {id}
  description: ""
  status: todo
  agent: ""
  depends_on: []""",

        "agent": """@agent
  id: {id}
  description: ""
  model: ""
  capabilities: []
  tools: []""",

        "workflow": """@workflow
  id: {id}
  description: ""
  steps: []
  triggers: []""",

        "policy": """@policy
  id: {id}
  description: ""
  rules: []
  enforcement: warn""",

        "test": """@test
  id: {id}
  description: ""
  command: ""
  expected: """"",
    }

    def create(self, workspace_path: str, type: str, id: str, filename: Optional[str] = None) -> str:
        alp_dir = os.path.join(workspace_path, ".alp")
        if not os.path.isdir(alp_dir):
            raise FileNotFoundError(f".alp directory not found in {workspace_path}")

        template = self.TEMPLATES.get(type)
        if template is None:
            raise ValueError(f"Unknown template type: {type}. Available: {', '.join(self.TEMPLATES.keys())}")

        target_name = filename or f"{id}.alp"
        target_path = os.path.join(alp_dir, target_name)

        if os.path.exists(target_path):
            raise FileExistsError(f"{target_name} already exists in {alp_dir}")

        content = template.replace("{id}", id)
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(content + "\n")

        return target_path

    @classmethod
    def available_types(cls) -> list[str]:
        return list(cls.TEMPLATES.keys())
