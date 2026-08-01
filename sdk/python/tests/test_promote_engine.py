import pytest
from alp_sdk import PromoteEngine


def test_promote_changes_type(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    file1 = alp_dir / "tasks.alp"
    file1.write_text("@task\n  id: task-1\n  description: First task\n", encoding="utf-8")

    engine = PromoteEngine()
    result = engine.promote(str(tmp_path), "task-1", "feature")

    assert result.old_type == "task"
    assert result.new_type == "feature"
    assert result.object_id == "task-1"
    content = file1.read_text(encoding="utf-8")
    assert content.startswith("@feature")


def test_promote_specific_file(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    file1 = alp_dir / "tasks.alp"
    file1.write_text("@task\n  id: task-1\n  description: First task\n", encoding="utf-8")
    file2 = alp_dir / "features.alp"
    file2.write_text("@feature\n  id: feature-1\n  description: Feature\n", encoding="utf-8")

    engine = PromoteEngine()
    result = engine.promote(str(tmp_path), "task-1", "feature", file=str(file1))

    assert result.old_type == "task"
    assert result.new_type == "feature"
    assert result.file == str(file1)


def test_promote_missing_object(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    file1 = alp_dir / "tasks.alp"
    file1.write_text("@task\n  id: task-1\n  description: First task\n", encoding="utf-8")

    engine = PromoteEngine()
    with pytest.raises(FileNotFoundError):
        engine.promote(str(tmp_path), "missing", "feature")


def test_promote_missing_alp_dir(tmp_path):
    engine = PromoteEngine()
    with pytest.raises(FileNotFoundError):
        engine.promote(str(tmp_path), "task-1", "feature")
