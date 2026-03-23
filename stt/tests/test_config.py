import shutil
import unittest
from pathlib import Path

from stt_cli.config import get_runtime_config, load_config


class LoadConfigTests(unittest.TestCase):
    def setUp(self) -> None:
        self.test_root = Path("tests/.tmp/test_config")
        self.test_root.mkdir(parents=True, exist_ok=True)

    def tearDown(self) -> None:
        shutil.rmtree(self.test_root, ignore_errors=True)

    def test_load_config_normalizes_extensions(self) -> None:
        config_path = self.test_root / "config.yaml"
        config_path.write_text(
            "\n".join(
                [
                    "models:",
                    '  small: "D:/models/test-small"',
                    '  large: "D:/models/test-large"',
                    'default_model: "large"',
                    'output_dir: "out"',
                    "supported_extensions:",
                    '  - "wav"',
                    '  - ".MP3"',
                ]
            ),
            encoding="utf-8",
        )

        config = load_config(config_path)

        self.assertEqual(config.models["small"], Path("D:/models/test-small"))
        self.assertEqual(config.models["large"], Path("D:/models/test-large"))
        self.assertEqual(config.default_model, "large")
        self.assertEqual(config.output_dir, Path("out"))
        self.assertEqual(config.supported_extensions, (".wav", ".mp3"))

    def test_load_config_supports_legacy_model_path(self) -> None:
        config_path = self.test_root / "legacy_config.yaml"
        config_path.write_text(
            "\n".join(
                [
                    'model_path: "D:/models/test"',
                    'output_dir: "out"',
                ]
            ),
            encoding="utf-8",
        )

        config = load_config(config_path)
        runtime_config = get_runtime_config(config)

        self.assertEqual(config.default_model, "default")
        self.assertEqual(runtime_config.model_name, "default")
        self.assertEqual(runtime_config.model_path, Path("D:/models/test"))


if __name__ == "__main__":
    unittest.main()
