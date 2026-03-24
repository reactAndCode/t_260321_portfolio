from __future__ import annotations

from pathlib import Path


def build_transcript_filename(input_file: str | Path) -> str:
    source = Path(input_file)
    return f"{source.stem}_변환후결과.txt"


def write_transcript(output_dir: str | Path, input_file: str | Path, transcript: str) -> Path:
    output_root = Path(output_dir)
    output_root.mkdir(parents=True, exist_ok=True)

    target = output_root / build_transcript_filename(input_file)
    target.write_text(transcript, encoding="utf-8")
    return target
