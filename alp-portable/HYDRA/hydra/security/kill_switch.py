from __future__ import annotations


class KillSwitch:
    def __init__(self) -> None:
        self._active = True

    def trigger(self) -> None:
        self._active = False

    def is_active(self) -> bool:
        return self._active
