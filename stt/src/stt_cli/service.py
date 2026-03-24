from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import time
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


@dataclass(slots=True)
class ProgressUpdate:
    completed_count: int
    total_count: int
    current_file_name: str
    elapsed_seconds: float
    average_seconds_per_file: float | None
    estimated_remaining_seconds: float | None


class ProgressCallback(Protocol):
    def __call__(self, update: ProgressUpdate) -> None:
        ...


def transcribe_files(
    audio_files: list[Path],
    runtime_config: RuntimeConfig,
    transcriber: FileTranscriber,
    save_output: bool = True,
    progress_callback: ProgressCallback | None = None,
) -> list[TranscriptionResult]:
    results: list[TranscriptionResult] = []
    started_at = time.perf_counter()
    total_count = len(audio_files)

    for index, audio_file in enumerate(audio_files, start=1):
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

        if progress_callback is not None:
            elapsed_seconds = time.perf_counter() - started_at
            average_seconds_per_file = elapsed_seconds / index if index else None
            remaining_count = total_count - index
            estimated_remaining_seconds = (
                average_seconds_per_file * remaining_count if remaining_count > 0 else 0.0
            )
            progress_callback(
                ProgressUpdate(
                    completed_count=index,
                    total_count=total_count,
                    current_file_name=audio_file.name,
                    elapsed_seconds=elapsed_seconds,
                    average_seconds_per_file=average_seconds_per_file,
                    estimated_remaining_seconds=estimated_remaining_seconds,
                )
            )

    return results
