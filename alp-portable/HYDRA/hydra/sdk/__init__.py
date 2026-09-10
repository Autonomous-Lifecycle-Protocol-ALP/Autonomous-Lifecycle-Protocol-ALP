from __future__ import annotations

from typing import Any, Callable


class Skill:
    def __init__(self, name: str, handler: Callable[..., Any], version: str = "0.1.0") -> None:
        self.name = name
        self.handler = handler
        self.version = version


class Agent:
    def __init__(self, name: str, skills: list[Skill] | None = None) -> None:
        self.name = name
        self.skills = skills or []

    def register_skill(self, skill: Skill) -> None:
        self.skills.append(skill)

    def can_handle(self, task: dict[str, Any]) -> bool:
        return any(s.name in task.get("required_skills", []) for s in self.skills)


class DeveloperSDK:
    def __init__(self) -> None:
        self._skills: dict[str, Skill] = {}
        self._agents: dict[str, Agent] = {}

    def register_skill(self, skill: Skill) -> None:
        self._skills[skill.name] = skill

    def register_agent(self, agent: Agent) -> None:
        self._agents[agent.name] = agent

    def list_skills(self) -> list[str]:
        return list(self._skills.keys())

    def list_agents(self) -> list[str]:
        return list(self._agents.keys())
