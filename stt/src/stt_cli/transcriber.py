from __future__ import annotations

from pathlib import Path

from faster_whisper import WhisperModel

from stt_cli.config import RuntimeConfig


class Transcriber:
    def __init__(self, config: RuntimeConfig) -> None:
        if not config.model_path.exists():
            raise FileNotFoundError(
                f"Configured model path does not exist: {config.model_path}"
            )

        self._config = config
        self._model = WhisperModel(
            str(config.model_path),
            device=config.device,
            compute_type=config.compute_type,
        )

    def transcribe_file(self, audio_path: str | Path) -> str:
        segments, _info = self._model.transcribe(
            str(audio_path),
            beam_size=self._config.beam_size,
            language=self._config.language,
        )
        return "".join(segment.text for segment in segments).strip()
