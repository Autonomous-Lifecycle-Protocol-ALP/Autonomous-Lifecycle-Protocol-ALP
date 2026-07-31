import os
import tempfile
import unittest

from alp_sdk.snapshot import SnapshotEngine, SnapshotDiff, WorkspaceSnapshot


class TestWorkspaceSnapshot(unittest.TestCase):
    def test_default_values(self):
        snap = WorkspaceSnapshot(name="snap-1")
        self.assertEqual(snap.name, "snap-1")
        self.assertEqual(snap.description, "")
        self.assertEqual(snap.object_count, 0)
        self.assertEqual(snap.project_count, 0)
        self.assertIsNotNone(snap.created_at)

    def test_custom_values(self):
        snap = WorkspaceSnapshot(
            name="snap-2",
            description="before deploy",
            object_count=10,
            project_count=3,
            created_at="2026-01-01T00:00:00Z",
        )
        self.assertEqual(snap.description, "before deploy")
        self.assertEqual(snap.object_count, 10)
        self.assertEqual(snap.project_count, 3)
        self.assertEqual(snap.created_at, "2026-01-01T00:00:00Z")

    def test_to_dict_roundtrip(self):
        snap = WorkspaceSnapshot(
            name="snap-3",
            description="test",
            object_count=5,
            project_count=1,
        )
        restored = WorkspaceSnapshot.from_dict(snap.to_dict())
        self.assertEqual(restored.name, snap.name)
        self.assertEqual(restored.description, snap.description)
        self.assertEqual(restored.object_count, snap.object_count)
        self.assertEqual(restored.project_count, snap.project_count)


class TestSnapshotDiff(unittest.TestCase):
    def test_empty_diff(self):
        diff = SnapshotDiff("a", "b", [], [], [])
        self.assertTrue(diff.is_empty)

    def test_non_empty_diff(self):
        diff = SnapshotDiff("a", "b", ["new-obj"], ["old-obj"], ["changed-obj"])
        self.assertFalse(diff.is_empty)
        self.assertEqual(diff.added, ["new-obj"])
        self.assertEqual(diff.removed, ["old-obj"])
        self.assertEqual(diff.modified, ["changed-obj"])


class TestSnapshotEngine(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.engine = SnapshotEngine()

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_create_and_list(self):
        objs = [{"id": "task-1", "_type": "task"}]
        projs = [{"id": "core", "path": "./core"}]
        snap = self.engine.create(self.tmp, objs, projs, description="initial")
        self.assertIsNotNone(snap.name)
        self.assertEqual(snap.object_count, 1)
        self.assertEqual(snap.project_count, 1)

        listed = self.engine.list(self.tmp)
        self.assertEqual(len(listed), 1)
        self.assertEqual(listed[0].name, snap.name)

    def test_create_multiple_snapshots(self):
        self.engine.create(self.tmp, [{"id": "a"}], [])
        self.engine.create(self.tmp, [{"id": "b"}], [])
        listed = self.engine.list(self.tmp)
        self.assertEqual(len(listed), 2)

    def test_restore(self):
        objs = [{"id": "task-1", "_type": "task"}]
        projs = [{"id": "core"}]
        snap = self.engine.create(self.tmp, objs, projs)
        restored = self.engine.restore(self.tmp, snap.name)
        self.assertEqual(len(restored["objects"]), 1)
        self.assertEqual(restored["objects"][0]["id"], "task-1")

    def test_restore_missing_raises(self):
        with self.assertRaises(FileNotFoundError):
            self.engine.restore(self.tmp, "missing-snap")

    def test_diff(self):
        objs_a = [{"id": "task-1", "_type": "task"}, {"id": "task-2", "_type": "task"}]
        objs_b = [{"id": "task-1", "_type": "task"}, {"id": "task-3", "_type": "task"}]
        snap_a = self.engine.create(self.tmp, objs_a, [], description="a")
        snap_b = self.engine.create(self.tmp, objs_b, [], description="b")
        diff = self.engine.diff(self.tmp, snap_a.name, snap_b.name)
        self.assertEqual(diff.added, ["task-3"])
        self.assertEqual(diff.removed, ["task-2"])
        self.assertEqual(diff.modified, [])

    def test_diff_modified(self):
        objs_a = [{"id": "task-1", "_type": "task", "status": "[ ]"}]
        objs_b = [{"id": "task-1", "_type": "task", "status": "[x]"}]
        snap_a = self.engine.create(self.tmp, objs_a, [])
        snap_b = self.engine.create(self.tmp, objs_b, [])
        diff = self.engine.diff(self.tmp, snap_a.name, snap_b.name)
        self.assertEqual(diff.modified, ["task-1"])
        self.assertTrue(diff.is_empty is False)

    def test_delete(self):
        objs = [{"id": "task-1"}]
        snap = self.engine.create(self.tmp, objs, [])
        self.assertEqual(len(self.engine.list(self.tmp)), 1)
        self.engine.delete(self.tmp, snap.name)
        self.assertEqual(len(self.engine.list(self.tmp)), 0)

    def test_delete_missing_raises(self):
        with self.assertRaises(FileNotFoundError):
            self.engine.delete(self.tmp, "missing-snap")

    def test_list_empty_workspace(self):
        listed = self.engine.list(self.tmp)
        self.assertEqual(listed, [])

    def test_create_persists_to_disk(self):
        objs = [{"id": "task-1"}]
        snap = self.engine.create(self.tmp, objs, [])
        path = os.path.join(self.tmp, ".alp", ".snapshots", f"{snap.name}.json")
        self.assertTrue(os.path.exists(path))


if __name__ == '__main__':
    unittest.main()
