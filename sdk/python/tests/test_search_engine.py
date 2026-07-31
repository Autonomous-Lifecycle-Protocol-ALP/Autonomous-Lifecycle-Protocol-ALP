import unittest
import tempfile
import os

from alp_sdk.search_engine import SearchEngine, SearchResult


class TestSearchEngine(unittest.TestCase):
    def setUp(self):
        self.engine = SearchEngine()

    def test_search_by_id(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: task-1\n  description: Alpha\n@task\n  id: task-2\n  description: Beta\n")

            results = self.engine.search(tmp, "task-1")
            self.assertEqual(len(results), 1)
            self.assertEqual(results[0].object_id, "task-1")
            self.assertEqual(results[0].object_type, "task")

    def test_search_by_description(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: task-1\n  description: First task\n")

            results = self.engine.search(tmp, "First")
            self.assertEqual(len(results), 1)
            self.assertEqual(results[0].object_id, "task-1")

    def test_search_filter_by_type(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: task-1\n@agent\n  id: agent-1\n")

            results = self.engine.search(tmp, "1", object_type="agent")
            self.assertEqual(len(results), 1)
            self.assertEqual(results[0].object_id, "agent-1")

    def test_search_regex(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: task-1\n  description: First task\n@task\n  id: task-2\n  description: Second task\n")

            results = self.engine.search(tmp, "^task-\\d$", regex=True)
            self.assertEqual(len(results), 2)
            ids = [r.object_id for r in results]
            self.assertIn("task-1", ids)
            self.assertIn("task-2", ids)

    def test_search_no_matches(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with open(os.path.join(alpdir, "a.alp"), "w") as f:
                f.write("@task\n  id: task-1\n")

            results = self.engine.search(tmp, "nothing")
            self.assertEqual(len(results), 0)

    def test_search_missing_directory_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):
                self.engine.search(tmp, "query")

    def test_search_result_to_dict(self):
        result = SearchResult(object_id="t1", object_type="task", file="a.alp", description="Test")
        d = result.to_dict()
        self.assertEqual(d["object_id"], "t1")
        self.assertEqual(d["object_type"], "task")
        self.assertEqual(d["file"], "a.alp")
        self.assertEqual(d["description"], "Test")


if __name__ == "__main__":
    unittest.main()
