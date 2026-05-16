from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    def load_dotenv(dotenv_path: Path) -> bool:
        if not dotenv_path.exists():
            return False
        for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())
        return True


load_dotenv(REPO_ROOT / ".env")


def _get_float(name: str, default: float) -> float:
    raw_value = os.getenv(name, str(default)).strip()
    try:
        return float(raw_value)
    except ValueError:
        return default


class Settings:
    def __init__(self) -> None:
        self.model_provider = os.getenv("MODEL_PROVIDER", "mock").strip().lower()
        self.chat_model = os.getenv("CHAT_MODEL", "gpt-4.1-mini").strip()
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.openai_base_url = os.getenv("OPENAI_BASE_URL", "").strip()
        self.temperature = _get_float("MODEL_TEMPERATURE", 0.6)
        self.default_perspective = os.getenv("DEFAULT_PERSPECTIVE", "persona_first_person").strip()
        self.persona_name = os.getenv("PERSONA_NAME", "Ava").strip()
        self.persona_role = os.getenv("PERSONA_ROLE", "a focused product mentor").strip()
        self.persona_style = os.getenv(
            "PERSONA_STYLE",
            "clear, practical, concise, and grounded in the provided context",
        ).strip()
        self.persona_data_path = os.getenv("PERSONA_DATA_PATH", "examples/toy_persona/persona_notes.md").strip()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
