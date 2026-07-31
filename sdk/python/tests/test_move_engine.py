import unittest
import tempfile
import os

from alp_sdk.move_engine import MoveEngine, MoveResult


class TestMoveEngine(unittest.TestCase):
    def setUp(self):
        self.engine = MoveEngine()

    def test_move_object_between_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: task-1\n  description: Alpha\n@task\n  id: task-2\n")
            with open(os.path.join(alpdir, "b.alp"), "w") as f:
                f.write("")

            result = self.engine.move(tmp, "task-1", "b.alp")

            self.assertEqual(result.object_id, "task-1")
            self.assertEqual(result.source_file, "a.alp")
            self.assertEqual(result.target_file, "b.alp")
            with open(os.path.join(alpdir, "a.alp")) as f:
                self.assertNotIn("task-1", f.read())
            with open(os.path.join(alpdir, "b.alp")) as f:
                self.assertIn("task-1", f.read())

    def test_move_creates_target_if_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: task-1\n")

            result = self.engine.move(tmp, "task-1", "new.alp")

            self.assertTrue(os.path.exists(os.path.join(alpdir, "new.alp")))
            self.assertEqual(result.target_file, "new.alp")

    def test_move_missing_object_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: task-1\n")

            with self.assertRaises(FileNotFoundError) as ctx:
                self.engine.move(tmp, "missing", "b.alp")
            self.assertIn("not found", str(ctx.exception))

    def test_move_invalid_extension_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: task-1\n")

            with self.assertRaises(ValueError) as ctx:
                self.engine.move(tmp, "task-1", "bad.txt")
            self.assertIn(".alp extension", str(ctx.exception))

    def test_move_missing_directory_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):
                self.engine.move(tmp, "task-1", "b.alp")

    def test_move_result_to_dict(self):
        result = MoveResult(object_id="t1", source_file="a.alp", target_file="b.alp")
        d = result.to_dict()
        self.assertEqual(d["object_id"], "t1")
        self.assertEqual(d["source_file"], "a.alp")
        self.assertEqual(d["target_file"], "b.alp")


if __name__ == "__main__":
    unittest.main()
