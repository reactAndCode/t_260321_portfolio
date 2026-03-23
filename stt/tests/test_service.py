import shutil
import unittest
from pathlib import Path

from stt_cli.config import RuntimeConfig
from stt_cli.service import transcribe_files


class FakeTranscriber:
    def __init__(self, failures: set[str] | None = None) -> None:
        self.failures = failures or set()

    def transcribe_file(self, audio_path: str | Path) -> str:
        path = Path(audio_path)
        if path.name in self.failures:
            raise RuntimeError("mock failure")
        return f"transcript:{path.stem}"


class ServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.test_root = Path("tests/.tmp/test_service")
        self.test_root.mkdir(parents=True, exist_ok=True)
        self.output_dir = self.test_root / "out"

    def tearDown(self) -> None:
        shutil.rmtree(self.test_root, ignore_errors=True)

    def test_transcribe_files_saves_output_for_successes(self) -> None:
        audio_file = self.test_root / "a.wav"
        audio_file.write_text("x", encoding="utf-8")
        runtime_config = RuntimeConfig(
            model_name="small",
            model_path=Path("D:/models/small"),
            device="cpu",
            compute_type="int8",
            language=None,
            beam_size=5,
            output_dir=self.output_dir,
            supported_extensions=(".wav",),
        )

        results = transcribe_files([audio_file], runtime_config, FakeTranscriber())

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].status, "success")
        self.assertEqual(results[0].transcript, "transcript:a")
        self.assertTrue((self.output_dir / "a.txt").is_file())

    def test_transcribe_files_collects_failures(self) -> None:
        success_file = self.test_root / "a.wav"
        failed_file = self.test_root / "b.wav"
        success_file.write_text("x", encoding="utf-8")
        failed_file.write_text("x", encoding="utf-8")
        runtime_config = RuntimeConfig(
            model_name="small",
            model_path=Path("D:/models/small"),
            device="cpu",
            compute_type="int8",
            language=None,
            beam_size=5,
            output_dir=self.output_dir,
            supported_extensions=(".wav",),
        )

        results = transcribe_files(
            [success_file, failed_file],
            runtime_config,
            FakeTranscriber(failures={"b.wav"}),
            save_output=False,
        )

        self.assertEqual(results[0].status, "success")
        self.assertEqual(results[1].status, "failed")
        self.assertEqual(results[1].error_message, "mock failure")
        self.assertIsNone(results[0].output_path)


if __name__ == "__main__":
    unittest.main()
