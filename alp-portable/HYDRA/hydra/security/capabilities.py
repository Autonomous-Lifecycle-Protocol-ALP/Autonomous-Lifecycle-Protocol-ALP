from __future__ import annotations

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
