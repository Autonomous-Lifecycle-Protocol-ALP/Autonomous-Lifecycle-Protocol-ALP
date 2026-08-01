import pytest
from alp_sdk import SplitEngine


def test_split_creates_type_files(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    source = alp_dir / "mixed.alp"
    source.write_text("@task\n  id: task-1\n  description: First task\n@agent\n  id: agent-1\n  model: gpt-4\n@task\n  id: task-2\n  description: Second task\n", encoding="utf-8")

    engine = SplitEngine()
    result = engine.split(str(tmp_path), "mixed.alp")

    assert result.total_objects == 3
    assert set(result.created_files) == {"tasks.alp", "agents.alp"}
    assert (alp_dir / "tasks.alp").exists()
    assert (alp_dir / "agents.alp").exists()
    tasks_content = (alp_dir / "tasks.alp").read_text(encoding="utf-8")
    assert "task-1" in tasks_content
    assert "task-2" in tasks_content
    agents_content = (alp_dir / "agents.alp").read_text(encoding="utf-8")
    assert "agent-1" in agents_content


def test_split_with_type_filter(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    source = alp_dir / "mixed.alp"
    source.write_text("@task\n  id: task-1\n  description: First task\n@agent\n  id: agent-1\n  model: gpt-4\n", encoding="utf-8")

    engine = SplitEngine()
    result = engine.split(str(tmp_path), "mixed.alp", type_filter="task")

    assert result.created_files == ["tasks.alp"]
    assert (alp_dir / "tasks.alp").exists()
    assert not (alp_dir / "agents.alp").exists()


def test_split_missing_file(tmp_path):
    engine = SplitEngine()
    with pytest.raises(FileNotFoundError):
        engine.split(str(tmp_path), "missing.alp")


def test_split_empty_file(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    source = alp_dir / "empty.alp"
    source.write_text("", encoding="utf-8")

    engine = SplitEngine()
    result = engine.split(str(tmp_path), "empty.alp")

    assert result.total_objects == 0
    assert result.created_files == []
