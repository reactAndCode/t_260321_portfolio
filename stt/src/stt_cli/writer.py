from __future__ import annotations

from pathlib import Path


def write_transcript(output_dir: str | Path, input_file: str | Path, transcript: str) -> Path:
    output_root = Path(output_dir)
    output_root.mkdir(parents=True, exist_ok=True)

    source = Path(input_file)
    target = output_root / f"{source.stem}.txt"
    target.write_text(transcript, encoding="utf-8")
    return target
