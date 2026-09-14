from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass
class AuditEntry:
    task: str
    agent: str
    action: str
    target: str
    permission: str
    sandbox: str | None = None
    risk: str = "LOW"
    result: str = "SUCCESS"
    verification: str = "PASS"
    timestamp: str = ""

    def __post_init__(self) -> None:
        if not self.timestamp:
            self.timestamp = datetime.utcnow().isoformat() + "Z"


class AuditLog:
    def __init__(self) -> None:
        self._entries: list[AuditEntry] = []

    def record(self, entry: AuditEntry) -> None:
        self._entries.append(entry)

    def entries(self) -> list[AuditEntry]:
        return list(self._entries)
