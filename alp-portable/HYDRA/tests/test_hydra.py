from __future__ import annotations

from hydra.inference import LocalModelAdapter, ModelCapabilities

from hydra.skills import DeveloperSDK, Skill
from hydra.tools import FilesystemTool, GitTool, TerminalTool


def test_local_model_adapter_infer():
    model = LocalModelAdapter("tiny", "", ModelCapabilities())
    model.load()
    assert model.infer("hello").startswith("[local:tiny]")


def test_skill_registry():
    sdk = DeveloperSDK()
    sdk.register_skill(Skill("python", lambda: None))
    assert "python" in sdk.list_skills()


def test_filesystem_tool():
    tool = FilesystemTool()
    result = tool.execute({"path": "."})
    assert result.success is True


def test_terminal_tool():
    tool = TerminalTool()
    result = tool.execute({"command": "ls"})
    assert result.output["command"] == "ls"


def test_git_tool():
    tool = GitTool()
    result = tool.execute({"repo": "."})
    assert result.success is True
