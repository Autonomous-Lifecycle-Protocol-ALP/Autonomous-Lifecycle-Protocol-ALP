import pytest
from alp_sdk import TestEngine, TestSuiteResult


def test_run_file(tmp_path):
    alp_file = tmp_path / "tasks.alp"
    alp_file.write_text("@task\n  id: task-1\n  description: First\n@test task-1\n  command: echo hello\n  expected: hello\n", encoding="utf-8")

    engine = TestEngine()
    result = engine.run_file(str(alp_file))

    assert isinstance(result, TestSuiteResult)
    assert result.file == str(alp_file)


def test_run_workspace(tmp_path):
    alp_dir = tmp_path / ".alp"
    alp_dir.mkdir()
    (alp_dir / "tasks.alp").write_text("@task\n  id: task-1\n  description: First\n", encoding="utf-8")
    (alp_dir / "agents.alp").write_text("@agent\n  id: agent-1\n  model: gpt-4\n", encoding="utf-8")

    engine = TestEngine()
    results = engine.run_workspace(str(alp_dir))

    assert len(results) == 2


def test_get_summary(tmp_path):
    alp_file = tmp_path / "tasks.alp"
    alp_file.write_text("@test task-1\n  command: echo hello\n  expected: hello\n", encoding="utf-8")

    engine = TestEngine()
    results = [engine.run_file(str(alp_file))]
    summary = engine.get_summary(results)

    assert summary.total_tests >= 0


def test_test_suite_result_properties(tmp_path):
    alp_file = tmp_path / "tasks.alp"
    alp_file.write_text("@test task-1\n  command: echo hello\n  expected: hello\n", encoding="utf-8")

    engine = TestEngine()
    result = engine.run_file(str(alp_file))

    assert result.passed >= 0
    assert result.total >= 0
    assert result.duration_ms >= 0
