import pytest
from alp_sdk import DeduplicateEngine


def test_deduplicate_removes_duplicates(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    file1 = alp_dir / "a.alp"
    file1.write_text("@task\n  id: task-1\n  description: First\n@task\n  id: task-2\n  description: Second\n", encoding="utf-8")
    file2 = alp_dir / "b.alp"
    file2.write_text("@task\n  id: task-1\n  description: Duplicate\n", encoding="utf-8")

    engine = DeduplicateEngine()
    result = engine.deduplicate(str(tmp_path))

    assert result.removed_count == 1
    assert result.removed_ids == ["task-1"]
    assert "task-1" in file1.read_text(encoding="utf-8")
    assert "task-1" not in file2.read_text(encoding="utf-8")


def test_deduplicate_no_duplicates(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    file1 = alp_dir / "a.alp"
    file1.write_text("@task\n  id: task-1\n  description: First\n@task\n  id: task-2\n  description: Second\n", encoding="utf-8")

    engine = DeduplicateEngine()
    result = engine.deduplicate(str(tmp_path))

    assert result.removed_count == 0
    assert result.removed_ids == []


def test_deduplicate_missing_alp_dir(tmp_path):
    engine = DeduplicateEngine()
    with pytest.raises(FileNotFoundError):
        engine.deduplicate(str(tmp_path))


def test_deduplicate_multiple_duplicates(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    file1 = alp_dir / "a.alp"
    file1.write_text("@task\n  id: task-1\n  description: First\n", encoding="utf-8")
    file2 = alp_dir / "b.alp"
    file2.write_text("@task\n  id: task-1\n  description: Dup 1\n@task\n  id: task-2\n  description: Dup 2\n", encoding="utf-8")

    engine = DeduplicateEngine()
    result = engine.deduplicate(str(tmp_path))

    assert result.removed_count == 1
    assert result.removed_ids == ["task-1"]
    assert "task-1" in file1.read_text(encoding="utf-8")
    assert "task-1" not in file2.read_text(encoding="utf-8")
    assert "task-2" in file2.read_text(encoding="utf-8")
