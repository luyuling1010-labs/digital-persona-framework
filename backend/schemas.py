from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


Perspective = Literal["persona_first_person", "research_third_person"]
OutputLanguage = Literal["auto", "zh", "en"]
AnswerLength = Literal["short", "medium", "long"]


class SourceItem(BaseModel):
    source_id: str = ""
    title: str = ""
    url: str = ""
    score: float = 0.0
    source_type: str = ""
    notes: str = ""


class ChatRequest(BaseModel):
    message: str
    top_k: int = Field(default=5, ge=1, le=20)
    perspective: Perspective = "persona_first_person"
    output_mode: str = "text"
    output_language: OutputLanguage = "auto"
    answer_length: AnswerLength = "medium"
    include_sources: bool = True
    show_all_sources: bool = False


class ChatResponse(BaseModel):
    answer: str
    answer_en: str | None = None
    subtitle_zh: str | None = None
    question_type: str
    collections: list[str]
    perspective: str
    sources: list[SourceItem]
    warnings: list[str]
