from __future__ import annotations

import argparse
import sys
from pathlib import Path

from stt_cli.config import get_runtime_config, load_config
from stt_cli.discovery import discover_audio_files
from stt_cli.service import transcribe_files


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Transcribe local audio with faster-whisper.")
    parser.add_argument("--config", required=True, help="Path to YAML config file.")
    parser.add_argument("--input", required=True, help="Path to an audio file or folder.")
    parser.add_argument(
        "--model",
        help="Optional model profile name from config.yaml. Defaults to config.default_model.",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    try:
        config = load_config(args.config)
        runtime_config = get_runtime_config(config, args.model)
        audio_files = discover_audio_files(args.input, runtime_config.supported_extensions)
        if not audio_files:
            print(f"No supported audio files found in: {args.input}")
            return 1

        print(f"Model profile: {runtime_config.model_name}")
        print(f"Model path: {runtime_config.model_path}")
        print(f"Input path: {Path(args.input)}")
        print(f"Output dir: {runtime_config.output_dir}")

        from stt_cli.transcriber import Transcriber

        transcriber = Transcriber(runtime_config)
    except Exception as exc:
        print(f"Startup failed: {exc}", file=sys.stderr)
        return 1

    results = transcribe_files(audio_files, runtime_config, transcriber)

    success_count = 0
    failures = 0
    for result in results:
        if result.status == "success":
            print(f"[OK] {result.source_path} -> {result.output_path}")
            success_count += 1
        else:
            print(f"[FAIL] {result.source_path}: {result.error_message}", file=sys.stderr)
            failures += 1

    print(
        f"Completed. total={len(results)} success={success_count} failed={failures}"
    )
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
