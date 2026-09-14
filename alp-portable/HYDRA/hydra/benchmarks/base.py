from __future__ import annotations

from typing import Any

class Benchmark:
    name: str = ""

    def run(self) -> dict[str, Any]:
        return {"name": self.name, "success_rate": 0.0}
