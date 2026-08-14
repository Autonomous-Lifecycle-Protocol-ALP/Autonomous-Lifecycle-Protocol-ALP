from dataclasses import dataclass
from typing import Any


@dataclass
class ToolResult:
    success: bool
    output: Any
    error: str | None = None


class Tool(Protocol):
    name: str
    permissions: list[str]

    def execute(self, context: dict[str, Any]) -> ToolResult: ...


class FilesystemTool:
    name = "filesystem"
    permissions = ["project.read", "project.write"]

    def execute(self, context: dict[str, Any]) -> ToolResult:
        return ToolResult(success=True, output={"path": context.get("path")})


class TerminalTool:
    name = "terminal"
    permissions = ["terminal.execute"]

    def execute(self, context: dict[str, Any]) -> ToolResult:
        return ToolResult(success=True, output={"command": context.get("command")})


class GitTool:
    name = "git"
    permissions = ["git.read", "git.write"]

    def execute(self, context: dict[str, Any]) -> ToolResult:
        return ToolResult(success=True, output={"repo": context.get("repo")})


TOOL_REGISTRY: dict[str, Tool] = {}


def register_tool(tool: Tool) -> None:
    TOOL_REGISTRY[tool.name] = tool
