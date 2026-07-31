import unittest
import tempfile
import os
import json

from alp_sdk.diff_engine import DiffEngine, DiffResult, DiffEntry


class TestDiffEngine(unittest.TestCase):
    def setUp(self):
        self.engine = DiffEngine()

    def test_diff_objects_added_removed_modified(self):
        objs_a = [
            {"id": "t1", "status": "todo"},
            {"id": "t2", "status": "done"},
        ]
        objs_b = [
            {"id": "t2", "status": "done"},
            {"id": "t3", "status": "todo"},
        ]

        result = self.engine.diff_objects(objs_a, objs_b, label_a="before", label_b="after")

        self.assertEqual(len(result.added), 1)
        self.assertEqual(result.added[0].obj_id, "t3")
        self.assertEqual(result.added[0].change_type, "added")

        self.assertEqual(len(result.removed), 1)
        self.assertEqual(result.removed[0].obj_id, "t1")
        self.assertEqual(result.removed[0].change_type, "removed")

        self.assertEqual(len(result.modified), 0)

    def test_diff_objects_identical(self):
        objs = [{"id": "t1", "status": "todo"}]
        result = self.engine.diff_objects(objs, objs, label_a="a", label_b="b")
        self.assertTrue(result.is_empty)
        self.assertEqual(len(result.added), 0)
        self.assertEqual(len(result.removed), 0)
        self.assertEqual(len(result.modified), 0)

    def test_diff_objects_no_shared_ids(self):
        objs_a = [{"id": "t1"}]
        objs_b = [{"id": "t2"}]
        result = self.engine.diff_objects(objs_a, objs_b)
        self.assertEqual(len(result.added), 1)
        self.assertEqual(len(result.removed), 1)
        self.assertEqual(len(result.modified), 0)

    def test_diff_snapshots_reads_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            snapdir = os.path.join(tmp, ".alp", ".snapshots")
            os.makedirs(snapdir, exist_ok=True)

            snap_a = {"metadata": {"name": "a"}, "objects": [{"id": "t1"}], "projects": []}
            snap_b = {"metadata": {"name": "b"}, "objects": [{"id": "t1", "v": 2}], "projects": []}

            with open(os.path.join(snapdir, "a.json"), "w") as f:
                json.dump(snap_a, f)
            with open(os.path.join(snapdir, "b.json"), "w") as f:
                json.dump(snap_b, f)

            result = self.engine.diff_snapshots(tmp, "a", "b")
            self.assertEqual(len(result.modified), 1)
            self.assertEqual(result.modified[0].obj_id, "t1")
            self.assertEqual(result.source_a, "a")
            self.assertEqual(result.source_b, "b")

    def test_diff_snapshots_missing_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            os.makedirs(os.path.join(tmp, ".alp", ".snapshots"), exist_ok=True)
            with self.assertRaises(FileNotFoundError):
                self.engine.diff_snapshots(tmp, "missing", "b")

    def test_diff_result_summary(self):
        objs_a = [{"id": "t1"}]
        objs_b = [{"id": "t2"}]
        result = self.engine.diff_objects(objs_a, objs_b, label_a="x", label_b="y")
        summary = result.summary()
        self.assertIn("+1", summary)
        self.assertIn("-1", summary)
        self.assertIn("~0", summary)

    def test_diff_entry_to_dict(self):
        entry = DiffEntry(obj_id="t1", change_type="modified", before={"v": 1}, after={"v": 2})
        d = entry.to_dict()
        self.assertEqual(d["id"], "t1")
        self.assertEqual(d["change_type"], "modified")
        self.assertIn("before", d)
        self.assertIn("after", d)

    def test_diff_result_to_dict(self):
        objs_a = [{"id": "t1"}]
        objs_b = [{"id": "t2"}]
        result = self.engine.diff_objects(objs_a, objs_b, label_a="a", label_b="b")
        d = result.to_dict()
        self.assertEqual(d["source_a"], "a")
        self.assertEqual(d["source_b"], "b")
        self.assertEqual(len(d["added"]), 1)
        self.assertEqual(len(d["removed"]), 1)


if __name__ == "__main__":
    unittest.main()
