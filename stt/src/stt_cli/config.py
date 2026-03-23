from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import yaml

DEFAULT_SUPPORTED_EXTENSIONS = (".mp3", ".wav", ".m4a", ".flac", ".ogg")


@dataclass(slots=True)
class AppConfig:
    models: dict[str, Path]
    default_model: str
    device: str = "cpu"
    compute_type: str = "int8"
    language: str | None = None
    beam_size: int = 5
    output_dir: Path = Path("outputs")
    supported_extensions: tuple[str, ...] = DEFAULT_SUPPORTED_EXTENSIONS

    def resolve_model_path(self, model_name: str | None = None) -> Path:
        selected_model = model_name or self.default_model
        try:
            return self.models[selected_model]
        except KeyError as exc:
            available = ", ".join(sorted(self.models))
            raise KeyError(
                f"Unknown model profile: {selected_model}. Available models: {available}"
            ) from exc


@dataclass(slots=True)
class RuntimeConfig:
    model_name: str
    model_path: Path
    device: str
    compute_type: str
    language: str | None
    beam_size: int
    output_dir: Path
    supported_extensions: tuple[str, ...]


def get_runtime_config(config: AppConfig, model_name: str | None = None) -> RuntimeConfig:
    selected_model = model_name or config.default_model
    return RuntimeConfig(
        model_name=selected_model,
        model_path=config.resolve_model_path(selected_model),
        device=config.device,
        compute_type=config.compute_type,
        language=config.language,
        beam_size=config.beam_size,
        output_dir=config.output_dir,
        supported_extensions=config.supported_extensions,
    )


def _load_models(raw: dict) -> tuple[dict[str, Path], str]:
    raw_models = raw.get("models")
    if isinstance(raw_models, dict) and raw_models:
        models = {str(name): Path(str(path)) for name, path in raw_models.items()}
        default_model = str(raw.get("default_model") or next(iter(models)))
        return models, default_model

    legacy_model_path = raw.get("model_path")
    if legacy_model_path:
        return {"default": Path(str(legacy_model_path))}, "default"

    raise ValueError("Config must define either 'models' or 'model_path'.")


def load_config(config_path: str | Path) -> AppConfig:
    path = Path(config_path)
    if not path.is_file():
        raise FileNotFoundError(f"Config file not found: {path}")

    with path.open("r", encoding="utf-8") as handle:
        raw = yaml.safe_load(handle) or {}

    models, default_model = _load_models(raw)
    supported_extensions = tuple(
        ext.lower() if str(ext).startswith(".") else f".{str(ext).lower()}"
        for ext in raw.get("supported_extensions", DEFAULT_SUPPORTED_EXTENSIONS)
    )

    return AppConfig(
        models=models,
        default_model=default_model,
        device=raw.get("device", "cpu"),
        compute_type=raw.get("compute_type", "int8"),
        language=raw.get("language"),
        beam_size=int(raw.get("beam_size", 5)),
        output_dir=Path(raw.get("output_dir", "outputs")),
        supported_extensions=supported_extensions,
    )
