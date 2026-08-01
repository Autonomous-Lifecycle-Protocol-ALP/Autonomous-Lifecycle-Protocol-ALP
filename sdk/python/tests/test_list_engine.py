import pytest
from alp_sdk import ListEngine


def test_list_all_objects(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    file1 = alp_dir / "tasks.alp"
    file1.write_text("@task\n  id: task-1\n  description: First\n@task\n  id: task-2\n  description: Second\n", encoding="utf-8")

    engine = ListEngine()
    result = engine.list(str(tmp_path))

    assert len(result.objects) == 2
    ids = [obj["id"] for obj in result.objects]
    assert "task-1" in ids
    assert "task-2" in ids


def test_list_with_type_filter(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    file1 = alp_dir / "mixed.alp"
    file1.write_text("@task\n  id: task-1\n  description: First\n@agent\n  id: agent-1\n  model: gpt-4\n", encoding="utf-8")

    engine = ListEngine()
    result = engine.list(str(tmp_path), type_filter="task")

    assert len(result.objects) == 1
    assert result.objects[0]["id"] == "task-1"
    assert result.objects[0]["type"] == "task"


def test_list_empty_directory(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()

    engine = ListEngine()
    result = engine.list(str(tmp_path))

    assert len(result.objects) == 0


def test_list_missing_alp_dir(tmp_path):
    engine = ListEngine()
    with pytest.raises(FileNotFoundError):
        engine.list(str(tmp_path))
