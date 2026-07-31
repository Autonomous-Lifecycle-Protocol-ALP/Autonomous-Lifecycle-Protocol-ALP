import unittest
import tempfile
import os

from alp_sdk.dependency_engine import DependencyEngine, DependencyResult


class TestDependencyEngine(unittest.TestCase):
    def setUp(self):
        self.engine = DependencyEngine()

    def test_inspect_dependencies(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: task-1\n  depends_on: task-2\n@task\n  id: task-2\n  depends_on: task-3\n@task\n  id: task-3\n")

            result = self.engine.inspect(tmp, "task-2")

            self.assertEqual(result.object_id, "task-2")
            self.assertIn("depends_on: task-3", result.depends_on)
            self.assertIn("task-1", result.depended_by)

    def test_inspect_no_dependencies(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: task-1\n  description: Alpha\n")

            result = self.engine.inspect(tmp, "task-1")

            self.assertEqual(len(result.depends_on), 0)
            self.assertEqual(len(result.depended_by), 0)

    def test_inspect_missing_object_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: task-1\n")

            with self.assertRaises(FileNotFoundError):
                self.engine.inspect(tmp, "missing")

    def test_inspect_missing_directory_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):
                self.engine.inspect(tmp, "task-1")

    def test_dependency_result_to_dict(self):
        result = DependencyResult(object_id="t1")
        result.depends_on = ["depends_on: t2"]
        result.depended_by = ["t3"]
        d = result.to_dict()
        self.assertEqual(d["object_id"], "t1")
        self.assertEqual(d["depends_on"], ["depends_on: t2"])
        self.assertEqual(d["depended_by"], ["t3"])


if __name__ == "__main__":
    unittest.main()
