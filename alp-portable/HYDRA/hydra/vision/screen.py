from __future__ import annotations

from typing import Any


class ScreenIntelligence:
    def capture(self) -> bytes:
        return b""

    def understand(self, image: bytes) -> dict[str, Any]:
        return {"elements": []}
