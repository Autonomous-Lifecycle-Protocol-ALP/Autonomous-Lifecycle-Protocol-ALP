import pytest
from alp_sdk import GraphEngine


def test_build_file(tmp_path):
    alp_file = tmp_path / "workflows.alp"
    alp_file.write_text("@task\n  id: task-1\n  depends_on: []\n@task\n  id: task-2\n  depends_on: [task-1]\n", encoding="utf-8")

    engine = GraphEngine()
    result = engine.build_file(str(alp_file))

    assert result.count == 2


def test_build_directory(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    (alp_dir / "tasks.alp").write_text("@task\n  id: task-1\n  depends_on: []\n", encoding="utf-8")
    (alp_dir / "agents.alp").write_text("@agent\n  id: agent-1\n  model: gpt-4\n", encoding="utf-8")

    engine = GraphEngine()
    result = engine.build_directory(str(alp_dir))

    assert result.count == 2


def test_graph_result_to_dict(tmp_path):
    alp_file = tmp_path / "tasks.alp"
    alp_file.write_text("@task\n  id: task-1\n  depends_on: []\n", encoding="utf-8")

    engine = GraphEngine()
    result = engine.build_file(str(alp_file))
    data = result.to_dict()

    assert data["count"] == 1
    assert len(data["nodes"]) == 1
    assert data["nodes"][0]["id"] == "task-1"


def test_build_empty_directory(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()

    engine = GraphEngine()
    result = engine.build_directory(str(alp_dir))

    assert result.count == 0
