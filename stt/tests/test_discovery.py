import unittest
from pathlib import Path
import shutil

from stt_cli.discovery import discover_audio_files


class DiscoveryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.test_root = Path("tests/.tmp/test_discovery")
        self.test_root.mkdir(parents=True, exist_ok=True)

    def tearDown(self) -> None:
        shutil.rmtree(self.test_root, ignore_errors=True)

    def test_discover_audio_files_from_directory(self) -> None:
        root = self.test_root
        (root / "a.wav").write_text("x", encoding="utf-8")
        (root / "b.mp3").write_text("x", encoding="utf-8")
        (root / "ignore.txt").write_text("x", encoding="utf-8")

        files = discover_audio_files(root, (".wav", ".mp3"))

        self.assertEqual(files, [root / "a.wav", root / "b.mp3"])

    def test_discover_audio_files_rejects_unsupported_file(self) -> None:
        file_path = self.test_root / "note.txt"
        file_path.write_text("x", encoding="utf-8")

        with self.assertRaises(ValueError):
            discover_audio_files(file_path, (".wav",))


if __name__ == "__main__":
    unittest.main()
