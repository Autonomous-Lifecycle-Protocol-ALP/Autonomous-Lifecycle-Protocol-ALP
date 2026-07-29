import unittest
from alp_sdk.intelligence import (
    IntelligenceEngine,
    SmartSuggestion,
    DiagnosisResult,
    PredictionResult,
    ReviewFinding,
)


class TestIntelligenceEngine(unittest.TestCase):
    def setUp(self):
        self.engine = IntelligenceEngine()

    def test_suggest_next_empty_workspace(self):
        suggestions = self.engine.suggest_next([])
        self.assertGreaterEqual(len(suggestions), 1)

    def test_suggest_next_missing_goal(self):
        suggestions = self.engine.suggest_next([
            {"_type": "task", "id": "task-1", "description": "A task"},
        ])
        goal_suggestions = [s for s in suggestions if s.type == "object" and "goal" in s.label.lower()]
        self.assertGreaterEqual(len(goal_suggestions), 1)

    def test_suggest_next_missing_tasks(self):
        suggestions = self.engine.suggest_next([
            {"_type": "goal", "id": "goal-1", "description": "A goal"},
        ])
        task_suggestions = [s for s in suggestions if "task" in s.label.lower()]
        self.assertGreaterEqual(len(task_suggestions), 1)

    def test_suggest_next_missing_agents(self):
        suggestions = self.engine.suggest_next([
            {"_type": "goal", "id": "goal-1", "description": "A goal"},
            {"_type": "task", "id": "task-1", "description": "A task"},
        ])
        agent_suggestions = [s for s in suggestions if "agent" in s.label.lower()]
        self.assertGreaterEqual(len(agent_suggestions), 1)

    def test_suggest_next_blocked_tasks(self):
        suggestions = self.engine.suggest_next([
            {"_type": "task", "id": "task-1", "status": "[!]"},
        ])
        fix_suggestions = [s for s in suggestions if s.type == "fix"]
        self.assertGreaterEqual(len(fix_suggestions), 1)

    def test_diagnose_cycle_error(self):
        result = self.engine.diagnose("Cycle detected in dependency graph")
        self.assertIn("cycle", result.likely_cause.lower())
        self.assertGreater(len(result.suggestions), 0)

    def test_diagnose_missing_reference(self):
        result = self.engine.diagnose("Reference task-99 not found")
        self.assertIn("not exist", result.likely_cause.lower())
        self.assertGreater(len(result.suggestions), 0)

    def test_diagnose_validation_error(self):
        result = self.engine.diagnose("Schema validation error: invalid type for field")
        self.assertIn("validation", result.likely_cause.lower())
        self.assertGreater(len(result.suggestions), 0)

    def test_diagnose_permission_error(self):
        result = self.engine.diagnose("Permission denied for path src/main.alp")
        self.assertIn("policy", result.likely_cause.lower())
        self.assertGreater(len(result.suggestions), 0)

    def test_diagnose_returns_id(self):
        result = self.engine.diagnose("some error")
        self.assertTrue(result.id.startswith("diag-"))

    def test_predict_outcome_unknown_task(self):
        result = self.engine.predict_outcome("missing", [])
        self.assertIsNone(result)

    def test_predict_outcome_all_deps_done(self):
        objects = [
            {"id": "task-1", "status": "[x]", "depends_on": []},
            {"id": "task-2", "status": "[ ]", "depends_on": ["task-1"]},
        ]
        result = self.engine.predict_outcome("task-2", objects)
        self.assertIsNotNone(result)
        self.assertEqual(result.predicted_status, "ready")
        self.assertGreater(result.confidence, 0.5)

    def test_predict_outcome_blocked_deps(self):
        objects = [
            {"id": "task-1", "status": "[!]"},
            {"id": "task-2", "status": "[ ]", "depends_on": ["task-1"]},
        ]
        result = self.engine.predict_outcome("task-2", objects)
        self.assertIsNotNone(result)
        self.assertEqual(result.predicted_status, "blocked")
        self.assertGreater(len(result.risk_factors), 0)

    def test_review_missing_description(self):
        findings = self.engine.review([
            {"_type": "task", "id": "task-1", "status": "[ ]"},
        ])
        missing_desc = [f for f in findings if f.kind == "missing_field"]
        self.assertGreaterEqual(len(missing_desc), 1)

    def test_review_missing_agent(self):
        findings = self.engine.review([
            {"_type": "task", "id": "task-1", "status": "[ ]"},
        ])
        no_agent = [f for f in findings if "no assigned agent" in f.message]
        self.assertGreaterEqual(len(no_agent), 1)

    def test_review_blocked_without_details(self):
        findings = self.engine.review([
            {"_type": "task", "id": "task-1", "status": "[!]"},
        ])
        blocked = [f for f in findings if f.object_id == "task-1" and f.kind == "missing_field"]
        self.assertGreaterEqual(len(blocked), 1)

    def test_review_missing_dependency(self):
        findings = self.engine.review([
            {"_type": "task", "id": "task-1", "depends_on": ["missing-dep"]},
        ])
        missing_dep = [f for f in findings if "does not exist" in f.message]
        self.assertGreaterEqual(len(missing_dep), 1)

    def test_review_clean_workspace(self):
        findings = self.engine.review([
            {"_type": "task", "id": "task-1", "description": "Do work", "agent": "agent-1", "status": "[ ]"},
        ])
        self.assertEqual(len(findings), 0)


if __name__ == "__main__":
    unittest.main()
