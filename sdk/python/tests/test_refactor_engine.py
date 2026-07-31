import unittest
import tempfile
import os

from alp_sdk.refactor_engine import RefactorEngine, RenameResult


class TestRefactorEngine(unittest.TestCase):
    def setUp(self):
        self.engine = RefactorEngine()

    def test_rename_updates_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: old-id\n  description: Alpha\n")
            with open(os.path.join(alpdir, "b.alp"), "w") as f:
                f.write("@task\n  id: old-id\n  depends_on: other\n")

            result = self.engine.rename(tmp, "old-id", "new-id")

            self.assertEqual(result.files_updated, 2)
            self.assertEqual(result.replacements, 2)
            self.assertEqual(result.old_id, "old-id")
            self.assertEqual(result.new_id, "new-id")
            with open(os.path.join(alpdir, "a.alp")) as f:
                self.assertIn("id: new-id", f.read())
            with open(os.path.join(alpdir, "b.alp")) as f:
                self.assertIn("id: new-id", f.read())

    def test_rename_missing_directory_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):
                self.engine.rename(tmp, "old-id", "new-id")

    def test_rename_no_matches(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: keep-me\n")

            result = self.engine.rename(tmp, "missing-id", "new-id")

            self.assertEqual(result.files_updated, 0)
            self.assertEqual(result.replacements, 0)

    def test_rename_result_to_dict(self):
        result = RenameResult(old_id="a", new_id="b", files_updated=1, replacements=2)
        d = result.to_dict()
        self.assertEqual(d["old_id"], "a")
        self.assertEqual(d["new_id"], "b")
        self.assertEqual(d["files_updated"], 1)
        self.assertEqual(d["replacements"], 2)


if __name__ == "__main__":
    unittest.main()
