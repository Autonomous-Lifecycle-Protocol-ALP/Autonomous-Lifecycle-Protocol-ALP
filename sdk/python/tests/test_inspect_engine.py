import unittest
import tempfile
import os

from alp_sdk.inspect_engine import InspectEngine, InspectResult


class TestInspectEngine(unittest.TestCase):
    def setUp(self):
        self.engine = InspectEngine()

    def test_inspect_object(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: task-1\n  description: Alpha\n  status: [ ]\n  agent: agent-1\n")

            result = self.engine.inspect(tmp, "task-1")

            self.assertEqual(result.object_id, "task-1")
            self.assertEqual(result.object_type, "task")
            self.assertEqual(result.properties["description"], "Alpha")
            self.assertEqual(result.properties["status"], "[ ]")
            self.assertEqual(result.properties["agent"], "agent-1")

    def test_inspect_with_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            filepath = os.path.join(alpdir, "a.alp")
            with open(filepath, "w") as f:
                f.write("@agent\n  id: agent-1\n  model: gpt-4\n")

            result = self.engine.inspect(tmp, "agent-1", file=filepath)

            self.assertEqual(result.object_id, "agent-1")
            self.assertEqual(result.object_type, "agent")
            self.assertEqual(result.properties["model"], "gpt-4")

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

    def test_inspect_result_to_dict(self):
        result = InspectResult(object_id="t1", object_type="task", file="a.alp", properties={"status": "[ ]"})
        d = result.to_dict()
        self.assertEqual(d["object_id"], "t1")
        self.assertEqual(d["object_type"], "task")
        self.assertEqual(d["properties"]["status"], "[ ]")


if __name__ == "__main__":
    unittest.main()
