from __future__ import annotations

import re
import sys
from typing import Any

from backend.config import get_settings
from backend.prompt_builder import GENERIC_IDENTITY_BOUNDARY


def _build_openai_client(api_key: str, base_url: str = "") -> Any:
    try:
        from openai import OpenAI
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("openai package is not installed.") from exc
    kwargs: dict[str, Any] = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    return OpenAI(**kwargs)


def _extract_question(messages: list[dict[str, str]]) -> str:
    for message in reversed(messages):
        if message.get("role") == "user":
            return str(message.get("content", "") or "")
    return ""


def _extract_system_field(messages: list[dict[str, str]], field_name: str) -> str:
    system_text = "\n".join(str(message.get("content", "")) for message in messages if message.get("role") == "system")
    match = re.search(rf"{re.escape(field_name)}:\s*(.+)", system_text)
    return match.group(1).strip() if match else ""


def _mock_response(messages: list[dict[str, str]]) -> str:
    question = _extract_question(messages)
    question_type = _extract_system_field(messages, "question_type") or "general_chat"
    output_language = "zh" if re.search(r"[\u4e00-\u9fff]", question) else "en"

    if output_language == "zh":
        return (
            "Chinese mock responses are intentionally left as a placeholder. "
            "Connect your own model and translation or subtitle provider for production use."
        )

    if question_type == "identity_boundary":
        return GENERIC_IDENTITY_BOUNDARY

    if question_type == "evidence_check":
        return (
            "I cannot verify that claim from the current demo context. "
            "Add source-backed persona material before treating it as confirmed."
        )

    if question_type == "product_advice":
        return (
            "Cut the noise first. A voice-first persona demo should let the user ask, "
            "hear the answer, read subtitles, and inspect boundaries and sources."
        )

    return (
        "Treat the persona as a product surface: short voice, clear boundaries, "
        "and grounded facts. Keep complexity in the system, not in the user's face."
    )


def _log_provider_error(provider: str, exc: Exception) -> None:
    print(f"[{provider}] API request failed: {type(exc).__name__}: {exc}", file=sys.stderr)


def generate_response(messages: list[dict[str, str]], request_timeout: int = 60) -> str:
    settings = get_settings()
    provider = settings.model_provider

    if provider == "mock":
        return _mock_response(messages)

    if provider not in {"openai", "openai-compatible"}:
        return f"Model provider `{provider}` is not supported by the generic template."
    if not settings.openai_api_key:
        return "Model call skipped: OPENAI_API_KEY is not configured."

    try:
        client = _build_openai_client(settings.openai_api_key, settings.openai_base_url)
        response = client.chat.completions.create(
            model=settings.chat_model,
            messages=messages,
            temperature=settings.temperature,
            timeout=request_timeout,
        )
        return response.choices[0].message.content or ""
    except Exception as exc:  # pragma: no cover
        _log_provider_error(provider, exc)
        return f"Model call failed: {type(exc).__name__}."
