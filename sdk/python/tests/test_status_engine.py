import pytest
from alp_sdk import StatusEngine


def test_get_status(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    (alp_dir / "tasks.alp").write_text("@task\n  id: task-1\n  status: [ ]\n@task\n  id: task-2\n  status: [x]\n", encoding="utf-8")

    engine = StatusEngine()
    result = engine.get_status(str(tmp_path))

    assert "task" in result.stats
    assert result.stats["task"].total == 2
    assert result.stats["task"].todo == 1
    assert result.stats["task"].done == 1


def test_get_status_multiple_types(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    (alp_dir / "mixed.alp").write_text("@task\n  id: task-1\n  status: [ ]\n@feature\n  id: feat-1\n  status: [~]\n", encoding="utf-8")

    engine = StatusEngine()
    result = engine.get_status(str(tmp_path))

    assert result.stats["task"].total == 1
    assert result.stats["feature"].total == 1


def test_get_status_empty_directory(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()

    engine = StatusEngine()
    result = engine.get_status(str(tmp_path))

    assert result.stats["task"].total == 0
    assert result.stats["feature"].total == 0


def test_status_result_to_dict(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    (alp_dir / "tasks.alp").write_text("@task\n  id: task-1\n  status: [ ]\n", encoding="utf-8")

    engine = StatusEngine()
    result = engine.get_status(str(tmp_path))
    data = result.to_dict()

    assert "task" in data
    assert data["task"]["total"] == 1
