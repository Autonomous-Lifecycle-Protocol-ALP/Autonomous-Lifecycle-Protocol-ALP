import pytest
from alp_sdk import ArchiveEngine


def test_archive_moves_objects_by_status(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    file1 = alp_dir / "tasks.alp"
    file1.write_text("@task\n  id: task-1\n  description: First\n  status: done\n@task\n  id: task-2\n  description: Second\n  status: todo\n", encoding="utf-8")

    engine = ArchiveEngine()
    result = engine.archive(str(tmp_path), "done")

    assert result.archived_count == 1
    assert result.archived_ids == ["task-1"]
    assert result.archive_file.endswith("archive.alp")
    content = file1.read_text(encoding="utf-8")
    assert "task-1" not in content
    assert "task-2" in content


def test_archive_creates_archive_file(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    file1 = alp_dir / "tasks.alp"
    file1.write_text("@task\n  id: task-1\n  description: First\n  status: done\n", encoding="utf-8")

    engine = ArchiveEngine()
    result = engine.archive(str(tmp_path), "done")

    assert (alp_dir / "archive.alp").exists()
    archive_content = (alp_dir / "archive.alp").read_text(encoding="utf-8")
    assert "task-1" in archive_content


def test_archive_no_matching_objects(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    file1 = alp_dir / "tasks.alp"
    file1.write_text("@task\n  id: task-1\n  description: First\n  status: todo\n", encoding="utf-8")

    engine = ArchiveEngine()
    result = engine.archive(str(tmp_path), "done")

    assert result.archived_count == 0
    assert result.archived_ids == []


def test_archive_missing_alp_dir(tmp_path):
    engine = ArchiveEngine()
    with pytest.raises(FileNotFoundError):
        engine.archive(str(tmp_path), "done")


def test_archive_multiple_files(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    file1 = alp_dir / "tasks.alp"
    file1.write_text("@task\n  id: task-1\n  description: First\n  status: done\n", encoding="utf-8")
    file2 = alp_dir / "agents.alp"
    file2.write_text("@agent\n  id: agent-1\n  model: gpt-4\n  status: done\n", encoding="utf-8")

    engine = ArchiveEngine()
    result = engine.archive(str(tmp_path), "done")

    assert result.archived_count == 2
    assert set(result.archived_ids) == {"task-1", "agent-1"}
