from __future__ import annotations

import re

from fastapi import FastAPI

from backend.chat_pipeline import run_chat
from backend.config import get_settings
from backend.schemas import ChatRequest, ChatResponse, SourceItem


app = FastAPI(title="Voice-First Persona Framework")


def _format_sources(items: list[dict]) -> list[SourceItem]:
    return [
        SourceItem(
            source_id=str(item.get("source_id", "") or ""),
            title=str(item.get("title", "") or ""),
            url=str(item.get("url", "") or ""),
            score=float(item.get("score", 0.0) or 0.0),
            source_type=str(item.get("source_type", "") or ""),
            notes=str(item.get("notes", "") or ""),
        )
        for item in items
    ]


def _is_english_text(text: str) -> bool:
    return bool(re.search(r"[A-Za-z]", text or "")) and not bool(re.search(r"[\u3400-\u9fff\uf900-\ufaff]", text or ""))


def _is_chinese_text(text: str) -> bool:
    return bool(re.search(r"[\u3400-\u9fff\uf900-\ufaff]", text or ""))


def _compact_spoken_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "app": "voice-first-persona-framework"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    settings = get_settings()
    perspective = request.perspective or settings.default_perspective
    result = run_chat(
        message=request.message,
        top_k=request.top_k,
        perspective=perspective,
        output_mode=request.output_mode,
        output_language=request.output_language,
        answer_length=request.answer_length,
        include_sources=request.include_sources,
        show_all_sources=request.show_all_sources,
    )

    answer = _compact_spoken_text(result["answer"])
    answer_en: str | None = None
    subtitle_zh: str | None = None

    if request.output_language == "en":
        answer_en = answer if _is_english_text(answer) else ""
        subtitle_zh = result.get("subtitle_zh") or ""
        if subtitle_zh and not _is_chinese_text(subtitle_zh):
            subtitle_zh = ""

    return ChatResponse(
        answer=answer,
        answer_en=answer_en,
        subtitle_zh=subtitle_zh,
        question_type=result["question_type"],
        collections=result["collections"],
        perspective=result["perspective"],
        sources=_format_sources(result["sources"]),
        warnings=result["warnings"],
    )
