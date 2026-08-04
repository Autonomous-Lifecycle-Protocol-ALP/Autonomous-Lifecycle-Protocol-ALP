import unittest
from alp_sdk.wasm_ast import WasmAstEvaluator, ASTNode, ASTDiagnostic, ASTEvaluationResult


class TestWasmAstEvaluator(unittest.TestCase):
    def setUp(self):
        self.evaluator = WasmAstEvaluator()

    def test_parse_policy_task_agent_blocks(self):
        content = """
@policy name: default-policy
@task name: task-1
@agent name: agent-1
"""
        result = self.evaluator.parseAST(content)
        self.assertEqual(len(result.ast), 3)
        kinds = [n.kind for n in result.ast]
        self.assertIn('POLICY', kinds)
        self.assertIn('TASK', kinds)
        self.assertIn('AGENT', kinds)

    def test_detects_missing_task_name(self):
        content = """
@task
"""
        result = self.evaluator.parseAST(content)
        errors = [d for d in result.diagnostics if d.severity == 'ERROR']
        self.assertGreaterEqual(len(errors), 1)
        self.assertIn('unnamed-task', [n.name for n in result.ast])

    def test_offline_valid_when_no_errors(self):
        content = """
@policy name: safe
@task name: ok
"""
        result = self.evaluator.parseAST(content)
        self.assertTrue(result.offline_valid)

    def test_offline_invalid_when_errors_exist(self):
        content = """
@task
"""
        result = self.evaluator.parseAST(content)
        self.assertFalse(result.offline_valid)

    def test_query_ast_nodes_by_kind(self):
        content = """
@task name: t1
@task name: t2
@agent name: a1
"""
        result = self.evaluator.parseAST(content)
        tasks = self.evaluator.queryASTNodes(result.ast, 'TASK')
        self.assertEqual(len(tasks), 2)
        agents = self.evaluator.queryASTNodes(result.ast, 'AGENT')
        self.assertEqual(len(agents), 1)

    def test_reports_parse_latency(self):
        content = "@policy name: p1\n"
        result = self.evaluator.parseAST(content)
        self.assertGreater(result.parse_latency_ms, 0)

    def test_ast_node_to_dict(self):
        node = ASTNode(node_id="n1", kind="TASK", name="t1", line=1, column=1)
        data = node.to_dict()
        self.assertEqual(data["id"], "n1")
        self.assertEqual(data["kind"], "TASK")

    def test_ast_diagnostic_to_dict(self):
        diag = ASTDiagnostic(rule_id="r1", severity="ERROR", message="bad", line=1)
        data = diag.to_dict()
        self.assertEqual(data["rule_id"], "r1")
        self.assertEqual(data["severity"], "ERROR")

    def test_ast_evaluation_result_to_dict(self):
        content = "@policy name: p1\n"
        result = self.evaluator.parseAST(content)
        data = result.to_dict()
        self.assertIn("ast", data)
        self.assertIn("diagnostics", data)
        self.assertIn("parseLatencyMs", data)
        self.assertIn("offlineValid", data)


if __name__ == "__main__":
    unittest.main()
