import pytest
from alp_sdk import LintEngine


def test_lint_valid_file(tmp_path):
    alp_file = tmp_path / "valid.alp"
    alp_file.write_text("@task\n  id: task-1\n  description: Valid task\n", encoding="utf-8")

    engine = LintEngine()
    result = engine.lint_file(str(alp_file))

    assert len(result.diagnostics) == 0


def test_lint_file_with_issues(tmp_path):
    alp_file = tmp_path / "bad.alp"
    alp_file.write_text("@task\n  id:  task-1\n  description:  Has double spaces\n", encoding="utf-8")

    engine = LintEngine()
    result = engine.lint_file(str(alp_file))

    assert len(result.diagnostics) > 0


def test_lint_directory(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    (alp_dir / "valid.alp").write_text("@task\n  id: task-1\n  description: Valid\n", encoding="utf-8")
    (alp_dir / "bad.alp").write_text("@task\n  id:  task-2\n  description:  Bad\n", encoding="utf-8")

    engine = LintEngine()
    result = engine.lint_directory(str(alp_dir))

    assert len(result.diagnostics) > 0


def test_lint_empty_directory(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()

    engine = LintEngine()
    result = engine.lint_directory(str(alp_dir))

    assert len(result.diagnostics) == 0
