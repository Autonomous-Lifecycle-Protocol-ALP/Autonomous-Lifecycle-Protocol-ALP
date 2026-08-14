from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class MemoryEntry:
    id: str
    source: str
    timestamp: str
    scope: str
    confidence: float
    provenance: str
    version: str = "0.1.0"
    classification: str = "internal"
    content: dict[str, Any] | None = None


class ProjectMemory:
    def __init__(self) -> None:
        self._entries: dict[str, MemoryEntry] = {}

    def add(self, entry: MemoryEntry) -> None:
        self._entries[entry.id] = entry

    def get(self, entry_id: str) -> MemoryEntry | None:
        return self._entries.get(entry_id)

    def search(self, scope: str | None = None) -> list[MemoryEntry]:
        entries = list(self._entries.values())
        if scope:
            entries = [e for e in entries if e.scope == scope]
        return entries


class EpisodicMemory(ProjectMemory):
    pass


class SkillMemory(ProjectMemory):
    pass
