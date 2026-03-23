# Local Whisper STT

`faster-whisper` based local STT tool with both CLI and Streamlit web UI.

## Requirements

- Python 3.10+
- Local Whisper model files downloaded in advance
- `ffmpeg` available on `PATH` for broad audio format support

## Install

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -e .
```

For tests:

```bash
pip install -e .[dev]
```

## Config

Copy `config.example.yaml` to `config.yaml` and update model paths.

```yaml
models:
  small: "D:/models/faster-whisper-small"
  large: "D:/models/faster-whisper-large-v3"
default_model: "small"
device: "cpu"
compute_type: "int8"
language: null
beam_size: 5
output_dir: "outputs"
supported_extensions:
  - ".mp3"
  - ".wav"
  - ".m4a"
  - ".flac"
```

## CLI Usage

Single file:

```bash
stt-cli --config config.yaml --input .\sample.wav
```

Folder batch:

```bash
stt-cli --config config.yaml --input .\audio
```

Select a model profile explicitly:

```bash
stt-cli --config config.yaml --input .\audio --model small
```

Each input file produces a `.txt` file in `output_dir`.

Without installing the console script, you can also run:

```bash
$env:PYTHONPATH="src"
python -m stt_cli --config config.yaml --input .\sample.wav
```

## Web UI

Run the Streamlit app locally:

```bash
streamlit run src/stt_cli/web_app.py -- --config config.yaml
```

The web UI supports:

- uploading multiple audio files
- switching between `small` and `large` model profiles
- viewing transcripts in the browser
- downloading each result as `.txt`
