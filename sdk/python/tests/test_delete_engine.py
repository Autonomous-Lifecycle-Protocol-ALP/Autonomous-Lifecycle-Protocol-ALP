import unittest
import tempfile
import os

from alp_sdk.delete_engine import DeleteEngine, DeleteResult


class TestDeleteEngine(unittest.TestCase):
    def setUp(self):
        self.engine = DeleteEngine()

    def test_delete_object(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: task-1\n  description: Alpha\n@task\n  id: task-2\n  description: Beta\n")

            result = self.engine.delete(tmp, "task-1")

            self.assertTrue(result.deleted)
            self.assertEqual(result.object_id, "task-1")
            with open(os.path.join(alpdir, "a.alp"), "r") as f:
                content = f.read()
            self.assertNotIn("task-1", content)
            self.assertIn("task-2", content)

    def test_delete_from_specific_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            filepath = os.path.join(alpdir, "a.alp")
            with open(filepath, "w") as f:
                f.write("@task\n  id: task-1\n  description: Alpha\n")

            result = self.engine.delete(tmp, "task-1", file=filepath)

            self.assertTrue(result.deleted)
            self.assertEqual(result.file, filepath)

    def test_delete_missing_object_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: task-1\n")

            with self.assertRaises(FileNotFoundError):
                self.engine.delete(tmp, "missing")

    def test_delete_missing_directory_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):
                self.engine.delete(tmp, "task-1")

    def test_delete_result_to_dict(self):
        result = DeleteResult(object_id="t1", file="a.alp", deleted=True)
        d = result.to_dict()
        self.assertEqual(d["object_id"], "t1")
        self.assertEqual(d["file"], "a.alp")
        self.assertTrue(d["deleted"])


if __name__ == "__main__":
    unittest.main()
