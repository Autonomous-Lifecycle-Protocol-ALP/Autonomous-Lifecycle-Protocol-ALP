import unittest
from alp_sdk.execution_quota import ExecutionQuotaEngine, ExecutionQuota


class TestExecutionQuotaEngine(unittest.TestCase):
    def test_creates_quota_and_allows_executions_within_limit(self):
        engine = ExecutionQuotaEngine()
        quota = engine.create_quota("q1", 3, 60000)
        self.assertEqual(quota.max_executions, 3)
        self.assertEqual(quota.window_ms, 60000)

        first = engine.record_execution("q1")
        self.assertTrue(first["allowed"])
        self.assertEqual(first["remaining"], 2)

        second = engine.record_execution("q1")
        self.assertTrue(second["allowed"])
        self.assertEqual(second["remaining"], 1)

    def test_blocks_executions_when_quota_exhausted(self):
        engine = ExecutionQuotaEngine()
        engine.create_quota("q2", 2, 60000)
        engine.record_execution("q2")
        engine.record_execution("q2")
        blocked = engine.record_execution("q2")
        self.assertFalse(blocked["allowed"])
        self.assertEqual(blocked["remaining"], 0)

    def test_resets_quota_after_explicit_reset(self):
        engine = ExecutionQuotaEngine()
        engine.create_quota("q3", 1, 60000)
        engine.record_execution("q3")
        blocked = engine.check_quota("q3")
        self.assertFalse(blocked["allowed"])

        engine.reset_quota("q3")
        after_reset = engine.check_quota("q3")
        self.assertTrue(after_reset["allowed"])
        self.assertEqual(after_reset["remaining"], 1)

    def test_check_quota_reports_remaining_before_execution(self):
        engine = ExecutionQuotaEngine()
        engine.create_quota("q4", 5, 60000)
        status = engine.check_quota("q4")
        self.assertTrue(status["allowed"])
        self.assertEqual(status["remaining"], 5)

    def test_returns_disallowed_for_missing_quota(self):
        engine = ExecutionQuotaEngine()
        self.assertIsNone(engine.get_quota("missing"))
        status = engine.check_quota("missing")
        self.assertFalse(status["allowed"])

    def test_execution_quota_to_dict(self):
        engine = ExecutionQuotaEngine()
        quota = engine.create_quota("q5", 10, 30000)
        data = quota.to_dict()
        self.assertEqual(data["id"], "q5")
        self.assertEqual(data["max_executions"], 10)


if __name__ == "__main__":
    unittest.main()
