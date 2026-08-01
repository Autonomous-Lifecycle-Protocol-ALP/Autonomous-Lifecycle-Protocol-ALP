import pytest
from alp_sdk import ValidateEngine


def test_validate_valid_file(tmp_path):
    alp_file = tmp_path / "valid.alp"
    alp_file.write_text("@task\n  id: task-1\n  description: Valid task\n", encoding="utf-8")

    engine = ValidateEngine()
    result = engine.validate_file(str(alp_file))

    assert result.valid is True
    assert len(result.errors) == 0


def test_validate_invalid_file(tmp_path):
    alp_file = tmp_path / "invalid.alp"
    alp_file.write_text("@task\n  description: Missing id\n", encoding="utf-8")

    engine = ValidateEngine()
    result = engine.validate_file(str(alp_file))

    assert result.valid is False
    assert len(result.errors) > 0


def test_validate_directory(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    (alp_dir / "valid.alp").write_text("@task\n  id: task-1\n  description: Valid\n", encoding="utf-8")
    (alp_dir / "invalid.alp").write_text("@task\n  description: Missing id\n", encoding="utf-8")

    engine = ValidateEngine()
    result = engine.validate_directory(str(alp_dir))

    assert result.valid is False
    assert len(result.errors) == 1


def test_validate_empty_directory(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()

    engine = ValidateEngine()
    result = engine.validate_directory(str(alp_dir))

    assert result.valid is True
    assert len(result.errors) == 0
