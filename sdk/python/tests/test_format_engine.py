import pytest
from alp_sdk import FormatEngine


def test_format_file(tmp_path):
    alp_file = tmp_path / "tasks.alp"
    alp_file.write_text("@task\nid: task-1\ndescription: First\n", encoding="utf-8")

    engine = FormatEngine()
    result = engine.format_file(str(alp_file))

    assert result.changed == 1
    assert result.checked == 1
    assert len(result.files) == 1


def test_format_file_check_mode(tmp_path):
    alp_file = tmp_path / "tasks.alp"
    alp_file.write_text("@task\nid: task-1\ndescription: First\n", encoding="utf-8")

    engine = FormatEngine()
    result = engine.format_file(str(alp_file), check=True)

    assert result.changed == 1
    assert result.checked == 1
    assert len(result.files) == 1


def test_format_directory(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    (alp_dir / "tasks.alp").write_text("@task\nid: task-1\ndescription: First\n", encoding="utf-8")
    (alp_dir / "agents.alp").write_text("@agent\nid: agent-1\nmodel: gpt-4\n", encoding="utf-8")

    engine = FormatEngine()
    result = engine.format_directory(str(alp_dir))

    assert result.changed == 2
    assert result.checked == 2


def test_format_empty_directory(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()

    engine = FormatEngine()
    result = engine.format_directory(str(alp_dir))

    assert result.changed == 0
    assert result.checked == 0
