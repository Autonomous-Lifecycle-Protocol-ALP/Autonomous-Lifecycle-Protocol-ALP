from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class ToolResult:
    success: bool
    output: Any
    error: str | None = None


class FilesystemTool:
    name = "filesystem"
    permissions = ["project.read", "project.write"]

    def execute(self, context: dict[str, Any]) -> ToolResult:
        path = context.get("path", ".")
        try:
            target = Path(path)
            if target.exists():
                return ToolResult(success=True, output={"exists": True, "path": str(target)})
            return ToolResult(success=True, output={"exists": False, "path": str(target)})
        except Exception as exc:
            return ToolResult(success=False, output=None, error=str(exc))


class TerminalTool:
    name = "terminal"
    permissions = ["terminal.execute"]

    def execute(self, context: dict[str, Any]) -> ToolResult:
        command = context.get("command", "")
        return ToolResult(success=True, output={"command": command, "stdout": "", "stderr": ""})


class GitTool:
    name = "git"
    permissions = ["git.read", "git.write"]

    def execute(self, context: dict[str, Any]) -> ToolResult:
        repo = context.get("repo", ".")
        return ToolResult(success=True, output={"repo": repo, "branch": "main"})


class CompilerTool:
    name = "compiler"
    permissions = ["terminal.execute"]

    def execute(self, context: dict[str, Any]) -> ToolResult:
        source = context.get("source", "")
        return ToolResult(success=True, output={"source": source, "compiled": True})


class TestRunnerTool:
    name = "test_runner"
    permissions = ["terminal.execute"]

    def execute(self, context: dict[str, Any]) -> ToolResult:
        target = context.get("target", ".")
        return ToolResult(success=True, output={"target": target, "passed": 0, "failed": 0})


class BrowserTool:
    name = "browser"
    permissions = ["screen.read", "browser.control"]

    def execute(self, context: dict[str, Any]) -> ToolResult:
        url = context.get("url", "")
        return ToolResult(success=True, output={"url": url, "status": 200})
