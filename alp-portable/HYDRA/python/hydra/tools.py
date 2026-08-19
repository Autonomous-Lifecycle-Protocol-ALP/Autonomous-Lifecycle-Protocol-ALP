"""Python-side tools for HYDRA."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ToolResult:
    success: bool
    output: Any
    error: str | None = None


class FilesystemTool:
    name = "filesystem"

    def execute(self, context: dict[str, Any]) -> ToolResult:
        return ToolResult(success=True, output={"path": context.get("path")})


class TerminalTool:
    name = "terminal"

    def execute(self, context: dict[str, Any]) -> ToolResult:
        return ToolResult(success=True, output={"command": context.get("command")})


class GitTool:
    name = "git"

    def execute(self, context: dict[str, Any]) -> ToolResult:
        return ToolResult(success=True, output={"repo": context.get("repo")})
