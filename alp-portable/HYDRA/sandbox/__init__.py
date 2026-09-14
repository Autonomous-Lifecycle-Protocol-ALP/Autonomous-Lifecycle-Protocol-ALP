from dataclasses import dataclass
from typing import Any


@dataclass
class SandboxConfig:
    cpu_limit: str | None = None
    ram_limit: str | None = None
    disk_limit: str | None = None
    network_policy: str = "deny"
    timeout: int = 600
    device_access: list[str] | None = None


class SandboxManager:
    def __init__(self) -> None:
        self._active: dict[str, Any] = {}

    def create(self, config: SandboxConfig) -> str:
        import uuid
        sandbox_id = uuid.uuid4().hex[:8]
        self._active[sandbox_id] = {"config": config, "status": "running"}
        return sandbox_id

    def destroy(self, sandbox_id: str) -> bool:
        if sandbox_id in self._active:
            del self._active[sandbox_id]
            return True
        return False

    def status(self, sandbox_id: str) -> dict[str, Any] | None:
        return self._active.get(sandbox_id)
