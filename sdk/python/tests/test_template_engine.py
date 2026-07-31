import unittest
import tempfile
import os

from alp_sdk.template_engine import TemplateEngine


class TestTemplateEngine(unittest.TestCase):
    def setUp(self):
        self.engine = TemplateEngine()

    def test_create_writes_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            path = self.engine.create(tmp, "task", "my-task")
            self.assertTrue(os.path.exists(path))
            with open(path) as f:
                content = f.read()
            self.assertIn("@task", content)
            self.assertIn("id: my-task", content)

    def test_create_unknown_type_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            with self.assertRaises(ValueError) as ctx:
                self.engine.create(tmp, "unknown", "id1")
            self.assertIn("Unknown template type", str(ctx.exception))

    def test_create_missing_directory_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):
                self.engine.create(tmp, "task", "id1")

    def test_create_existing_file_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            self.engine.create(tmp, "task", "my-task")
            with self.assertRaises(FileExistsError):
                self.engine.create(tmp, "task", "my-task")

    def test_available_types(self):
        types = TemplateEngine.available_types()
        self.assertIn("task", types)
        self.assertIn("agent", types)
        self.assertIn("workflow", types)
        self.assertIn("policy", types)
        self.assertIn("test", types)

    def test_create_custom_filename(self):
        with tempfile.TemporaryDirectory() as tmp:
            alpdir = os.path.join(tmp, ".alp")
            os.makedirs(alpdir, exist_ok=True)
            path = self.engine.create(tmp, "agent", "a1", filename="custom.alp")
            self.assertTrue(os.path.exists(path))
            self.assertEqual(os.path.basename(path), "custom.alp")


if __name__ == "__main__":
    unittest.main()
