from __future__ import annotations

import argparse
import tempfile
from pathlib import Path

import streamlit as st

from stt_cli.config import get_runtime_config, load_config
from stt_cli.service import ProgressUpdate, transcribe_files
from stt_cli.transcriber import Transcriber
from stt_cli.writer import build_transcript_filename


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--config", default="config.yaml", help="Path to YAML config file.")
    return parser


def _load_uploaded_files(uploaded_files: list, temp_dir: str) -> list[Path]:
    saved_paths: list[Path] = []
    root = Path(temp_dir)
    for uploaded in uploaded_files:
        target = root / uploaded.name
        target.write_bytes(uploaded.getbuffer())
        saved_paths.append(target)
    return saved_paths


def _format_duration(seconds: float | None) -> str:
    if seconds is None:
        return "계산 중"

    rounded = max(0, int(round(seconds)))
    hours, remainder = divmod(rounded, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def main() -> None:
    args, _unknown = _build_parser().parse_known_args()
    config = load_config(args.config)

    st.set_page_config(page_title="Local Whisper STT", layout="wide")
    st.title("Local Whisper STT Web UI")
    st.caption("Upload audio files, choose a local model, and download text results.")

    available_models = sorted(config.models)
    with st.sidebar:
        st.subheader("Settings")
        model_name = st.selectbox(
            "Model profile",
            options=available_models,
            index=available_models.index(config.default_model),
        )
        st.write(f"Model path: `{config.resolve_model_path(model_name)}`")
        st.write(f"Device: `{config.device}`")
        st.write(f"Language: `{config.language or 'auto-detect'}`")
        st.write(f"Supported: `{', '.join(config.supported_extensions)}`")

    upload_types = [extension.lstrip(".") for extension in config.supported_extensions]
    uploaded_files = st.file_uploader(
        "Audio files",
        type=upload_types,
        accept_multiple_files=True,
    )

    if not uploaded_files:
        st.info("Upload one or more audio files to start transcription.")
        return

    st.write(f"Selected files: {len(uploaded_files)}")

    if st.button("Start Transcription", type="primary"):
        runtime_config = get_runtime_config(config, model_name)
        progress_bar = st.progress(0, text="대기 중")
        status_container = st.empty()

        def on_progress(update: ProgressUpdate) -> None:
            progress_bar.progress(
                update.completed_count / update.total_count,
                text=(
                    f"{update.completed_count}/{update.total_count} 완료"
                    f" - 현재 파일: {update.current_file_name}"
                ),
            )
            status_container.markdown(
                "\n".join(
                    [
                        f"현재 파일: `{update.current_file_name}`",
                        f"경과 시간: `{_format_duration(update.elapsed_seconds)}`",
                        f"평균 처리 시간: `{_format_duration(update.average_seconds_per_file)}`",
                        f"예상 남은 시간: `{_format_duration(update.estimated_remaining_seconds)}`",
                    ]
                )
            )

        with st.spinner(f"Loading model '{model_name}' and transcribing files..."):
            with tempfile.TemporaryDirectory() as temp_dir:
                saved_paths = _load_uploaded_files(uploaded_files, temp_dir)
                transcriber = Transcriber(runtime_config)
                results = transcribe_files(
                    saved_paths,
                    runtime_config,
                    transcriber,
                    save_output=False,
                    progress_callback=on_progress,
                )
        progress_bar.progress(1.0, text="작업 완료")
        st.session_state["results"] = results
        st.session_state["model_name"] = model_name

    results = st.session_state.get("results", [])
    if not results:
        return

    success_count = sum(result.status == "success" for result in results)
    st.success(
        f"Completed with model '{st.session_state.get('model_name', model_name)}'. "
        f"total={len(results)} success={success_count} failed={len(results) - success_count}"
    )

    for result in results:
        if result.status == "success":
            with st.expander(result.source_name, expanded=False):
                st.text_area(
                    "Transcript",
                    value=result.transcript,
                    height=220,
                    key=f"transcript-{result.source_name}",
                )
                st.download_button(
                    "Download txt",
                    data=result.transcript.encode("utf-8"),
                    file_name=build_transcript_filename(result.source_name),
                    mime="text/plain",
                    key=f"download-{result.source_name}",
                )
        else:
            st.error(f"{result.source_name}: {result.error_message}")


if __name__ == "__main__":
    main()
