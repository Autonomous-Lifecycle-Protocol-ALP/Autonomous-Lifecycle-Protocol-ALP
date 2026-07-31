import unittest
import tempfile
import os

from alp_sdk.stats_engine import StatsEngine, WorkspaceStats, FileStats


class TestStatsEngine(unittest.TestCase):
    def setUp(self):
        self.engine = StatsEngine()

    def test_compute_counts_objects_and_types(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: t1\n@task\n  id: t2\n")
            with open(os.path.join(alpdir, "b.alp"), "w") as f:
                f.write("@agent\n  id: a1\n")

            def fake_parse(content):
                lines = [line.strip() for line in content.splitlines() if line.strip().startswith('@')]
                return [{"_type": line[1:].split()[0], "id": line.split('id:')[-1].strip()} for line in lines]

            stats = self.engine.compute(tmp, fake_parse)

            self.assertEqual(stats.files, 2)
            self.assertEqual(stats.total_objects, 3)
            self.assertEqual(stats.type_counts.get("task"), 2)
            self.assertEqual(stats.type_counts.get("agent"), 1)
            self.assertEqual(len(stats.file_stats), 2)

    def test_compute_missing_directory_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):
                self.engine.compute(tmp, lambda c: [])

    def test_workspace_stats_top_types(self):
        stats = WorkspaceStats()
        stats.add_file("a.alp", 2, {"task": 2})
        stats.add_file("b.alp", 1, {"agent": 1, "task": 1})
        top = stats.top_types
        self.assertEqual(top[0][0], "task")
        self.assertEqual(top[0][1], 3)

    def test_workspace_stats_to_dict(self):
        stats = WorkspaceStats()
        stats.add_file("a.alp", 1, {"task": 1})
        d = stats.to_dict()
        self.assertEqual(d["files"], 1)
        self.assertEqual(d["total_objects"], 1)
        self.assertEqual(d["type_counts"]["task"], 1)
        self.assertEqual(len(d["file_stats"]), 1)

    def test_file_stats_to_dict(self):
        fs = FileStats(file="a.alp", object_count=2)
        d = fs.to_dict()
        self.assertEqual(d["file"], "a.alp")
        self.assertEqual(d["object_count"], 2)


if __name__ == "__main__":
    unittest.main()
