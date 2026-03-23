from __future__ import annotations

from pathlib import Path


def discover_audio_files(input_path: str | Path, supported_extensions: tuple[str, ...]) -> list[Path]:
    path = Path(input_path)
    if not path.exists():
        raise FileNotFoundError(f"Input path not found: {path}")

    if path.is_file():
        if path.suffix.lower() not in supported_extensions:
            raise ValueError(f"Unsupported file extension: {path.suffix}")
        return [path]

    files = sorted(
        candidate
        for candidate in path.iterdir()
        if candidate.is_file() and candidate.suffix.lower() in supported_extensions
    )
    return files
