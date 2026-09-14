from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Budget:
    cpu_ms: int = 0
    ram_mb: int = 0
    disk_mb: int = 0
    time_s: int = 0
    tokens: int = 0
    tool_calls: int = 0
    retries: int = 0
    network: bool = False


class ResourceGovernor:
    def __init__(self, budget: Budget) -> None:
        self._budget = budget
        self._used = Budget()

    def check(self) -> bool:
        return True

    def exhausted(self) -> bool:
        return False
