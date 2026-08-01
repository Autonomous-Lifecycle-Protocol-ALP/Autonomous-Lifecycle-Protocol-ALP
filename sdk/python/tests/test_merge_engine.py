import pytest
from alp_sdk import MergeEngine


def test_merge_new_objects(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    source = alp_dir / "source.alp"
    target = alp_dir / "target.alp"
    source.write_text("@task\n  id: task-1\n  description: Source\n@task\n  id: task-2\n  description: Source 2\n", encoding="utf-8")
    target.write_text("@task\n  id: task-3\n  description: Target\n", encoding="utf-8")

    engine = MergeEngine()
    result = engine.merge(str(tmp_path), "source.alp", "target.alp")

    assert result.merged_count == 2
    assert set(result.merged_ids) == {"task-1", "task-2"}
    content = target.read_text(encoding="utf-8")
    assert "task-1" in content
    assert "task-2" in content
    assert "task-3" in content


def test_merge_skips_existing(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    source = alp_dir / "source.alp"
    target = alp_dir / "target.alp"
    source.write_text("@task\n  id: task-1\n  description: Source\n", encoding="utf-8")
    target.write_text("@task\n  id: task-1\n  description: Target\n", encoding="utf-8")

    engine = MergeEngine()
    result = engine.merge(str(tmp_path), "source.alp", "target.alp")

    assert result.merged_count == 0
    assert result.merged_ids == []


def test_merge_missing_source(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    target = alp_dir / "target.alp"
    target.write_text("@task\n  id: task-1\n", encoding="utf-8")

    engine = MergeEngine()
    with pytest.raises(FileNotFoundError):
        engine.merge(str(tmp_path), "missing.alp", "target.alp")


def test_merge_missing_target(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    source = alp_dir / "source.alp"
    source.write_text("@task\n  id: task-1\n", encoding="utf-8")

    engine = MergeEngine()
    with pytest.raises(FileNotFoundError):
        engine.merge(str(tmp_path), "source.alp", "missing.alp")


def test_merge_overwrite(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    source = alp_dir / "source.alp"
    target = alp_dir / "target.alp"
    source.write_text("@task\n  id: task-1\n  description: Source\n", encoding="utf-8")
    target.write_text("@task\n  id: task-2\n  description: Target\n", encoding="utf-8")

    engine = MergeEngine()
    result = engine.merge(str(tmp_path), "source.alp", "target.alp", overwrite=True)

    assert result.merged_count == 1
    assert result.merged_ids == ["task-1"]
    content = target.read_text(encoding="utf-8")
    assert "task-1" in content
    assert "task-2" in content
