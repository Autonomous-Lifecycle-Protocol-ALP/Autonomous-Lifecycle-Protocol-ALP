from __future__ import annotations

import hashlib
from dataclasses import dataclass


@dataclass
class ContextSlice:
    source: str
    content: str
    tokens_estimate: int = 0


class ContextEngine:
    def __init__(self, max_tokens: int = 4096) -> None:
        self._store: dict[str, list[ContextSlice]] = {}
        self._max_tokens = max_tokens

    def add(self, key: str, slice: ContextSlice) -> None:
        self._store.setdefault(key, []).append(slice)

    def build_prompt(self, key: str, query: str) -> str:
        slices = self._store.get(key, [])
        selected: list[str] = []
        total = 0
        for s in slices:
            if total + s.tokens_estimate > self._max_tokens:
                break
            selected.append(s.content)
            total += s.tokens_estimate
        return "\n\n".join(selected + [query])

    def fingerprint(self, text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]
