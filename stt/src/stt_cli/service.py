from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from stt_cli.config import RuntimeConfig
from stt_cli.writer import write_transcript


class FileTranscriber(Protocol):
    def transcribe_file(self, audio_path: str | Path) -> str:
        ...


@dataclass(slots=True)
class TranscriptionResult:
    source_name: str
    source_path: Path
    transcript: str = ""
    status: str = "success"
    error_message: str = ""
    output_path: Path | None = None


def transcribe_files(
    audio_files: list[Path],
    runtime_config: RuntimeConfig,
    transcriber: FileTranscriber,
    save_output: bool = True,
) -> list[TranscriptionResult]:
    results: list[TranscriptionResult] = []

    for audio_file in audio_files:
        result = TranscriptionResult(source_name=audio_file.name, source_path=audio_file)
        try:
            result.transcript = transcriber.transcribe_file(audio_file)
            if save_output:
                result.output_path = write_transcript(
                    runtime_config.output_dir,
                    audio_file,
                    result.transcript,
                )
        except Exception as exc:
            result.status = "failed"
            result.error_message = str(exc)
        results.append(result)

    return results
