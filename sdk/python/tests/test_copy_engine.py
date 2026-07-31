import unittest
import tempfile
import os

from alp_sdk.copy_engine import CopyEngine, CopyResult


class TestCopyEngine(unittest.TestCase):
    def setUp(self):
        self.engine = CopyEngine()

    def test_copy_updates_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: source-id\n  description: Alpha\n")
            with open(os.path.join(alpdir, "b.alp"), "w") as f:
                f.write("@task\n  id: source-id\n  depends_on: other\n")

            result = self.engine.copy(tmp, "source-id", "target-id")

            self.assertEqual(result.files_updated, 2)
            self.assertEqual(result.copies, 2)
            self.assertEqual(result.source_id, "source-id")
            self.assertEqual(result.target_id, "target-id")
            with open(os.path.join(alpdir, "a.alp")) as f:
                self.assertIn("id: target-id", f.read())
            with open(os.path.join(alpdir, "b.alp")) as f:
                self.assertIn("id: target-id", f.read())

    def test_copy_updates_refs_when_requested(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: source-id\n  depends_on: source-id\n")

            result = self.engine.copy(tmp, "source-id", "target-id", update_refs=True)

            self.assertEqual(result.copies, 1)
            with open(os.path.join(alpdir, "a.alp")) as f:
                content = f.read()
                self.assertIn("id: target-id", content)
                self.assertIn("depends_on: target-id", content)

    def test_copy_missing_directory_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):
                self.engine.copy(tmp, "source-id", "target-id")

    def test_copy_no_matches(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: keep-me\n")

            result = self.engine.copy(tmp, "missing-id", "target-id")

            self.assertEqual(result.files_updated, 0)
            self.assertEqual(result.copies, 0)

    def test_copy_result_to_dict(self):
        result = CopyResult(source_id="a", target_id="b", files_updated=1, copies=2)
        d = result.to_dict()
        self.assertEqual(d["source_id"], "a")
        self.assertEqual(d["target_id"], "b")
        self.assertEqual(d["files_updated"], 1)
        self.assertEqual(d["copies"], 2)


if __name__ == "__main__":
    unittest.main()
