import pytest
from alp_sdk import VisualizeEngine


def test_visualize_file(tmp_path):
    alp_file = tmp_path / "workflows.alp"
    alp_file.write_text("@workflow\n  id: my-workflow\n  steps: step1, step2, step3\n", encoding="utf-8")

    engine = VisualizeEngine()
    diagrams = engine.visualize_file(str(alp_file))

    assert len(diagrams) == 1
    assert diagrams[0].workflow_id == "my-workflow"


def test_visualize_file_format_dot(tmp_path):
    alp_file = tmp_path / "workflows.alp"
    alp_file.write_text("@workflow\n  id: my-workflow\n  steps: step1, step2\n", encoding="utf-8")

    engine = VisualizeEngine()
    diagrams = engine.visualize_file(str(alp_file), format="dot")

    assert len(diagrams) == 1
    assert diagrams[0].format == "dot"
    assert "digraph" in diagrams[0].content


def test_visualize_directory(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    (alp_dir / "w1.alp").write_text("@workflow\n  id: w1\n  steps: a, b\n", encoding="utf-8")
    (alp_dir / "w2.alp").write_text("@workflow\n  id: w2\n  steps: c, d\n", encoding="utf-8")

    engine = VisualizeEngine()
    diagrams = engine.visualize_directory(str(alp_dir))

    assert len(diagrams) == 2


def test_visualize_empty_file(tmp_path):
    alp_file = tmp_path / "empty.alp"
    alp_file.write_text("", encoding="utf-8")

    engine = VisualizeEngine()
    diagrams = engine.visualize_file(str(alp_file))

    assert len(diagrams) == 0
