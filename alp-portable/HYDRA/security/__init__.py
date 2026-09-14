from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class Capability:
    action: str
    scope: str
    expires_at: datetime | None = None


class CapabilityBroker:
    def request(self, action: str, scope: str) -> Capability:
        return Capability(action=action, scope=scope)

    def enforce(self, capability: Capability, target: dict[str, Any]) -> bool:
        return capability.scope in target.get("scopes", [])


class AuditLog:
    def __init__(self) -> None:
        self._entries: list[dict[str, Any]] = []

    def record(self, entry: dict[str, Any]) -> None:
        entry.setdefault("timestamp", datetime.utcnow().isoformat() + "Z")
        self._entries.append(entry)

    def entries(self) -> list[dict[str, Any]]:
        return list(self._entries)
