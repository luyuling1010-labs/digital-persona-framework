from __future__ import annotations

import re
from typing import Any

from backend.config import get_settings


PERSONA_FIRST_PERSON = "persona_first_person"
RESEARCH_THIRD_PERSON = "research_third_person"
GENERIC_IDENTITY_BOUNDARY = (
    "I am a digital persona simulation built from user-provided material, "
    "not the real person and not a substitute for verified sources."
)


def detect_output_language(user_message: str) -> str:
    text = (user_message or "").strip()
    if not text:
        return "en"
    if re.search(r"[\u4e00-\u9fff]", text):
        return "zh"
    return "en"


def _render_context(prompt_context: list[dict[str, Any]]) -> str:
    if not prompt_context:
        return "No background reference is available. Be explicit about uncertainty."
    lines: list[str] = []
    for index, item in enumerate(prompt_context, start=1):
        lines.extend(
            [
                f"[{index}] title: {item.get('title', '')}",
                f"    url: {item.get('url', '')}",
                f"    notes: {item.get('notes', '')}",
                f"    content: {item.get('content', '')}",
            ]
        )
    return "\n".join(lines)


def _perspective_instruction(perspective: str) -> str:
    if perspective == RESEARCH_THIRD_PERSON:
        return "Use a neutral third-person research voice. Prioritize source-grounded clarity."
    return "Use first person as a simulated persona. Keep the voice direct, concrete, and conversational."


def _length_instruction(answer_length: str) -> str:
    if answer_length == "short":
        return "Keep the answer to 2-4 short sentences."
    if answer_length == "long":
        return "Give a structured answer with concrete reasoning and caveats."
    return "Keep the answer concise but complete."


def build_prompt(
    user_message: str,
    route: dict[str, Any],
    retrieved_context: list[dict[str, Any]],
    perspective: str = PERSONA_FIRST_PERSON,
    output_language: str = "auto",
    answer_length: str = "medium",
) -> list[dict[str, str]]:
    settings = get_settings()
    resolved_language = detect_output_language(user_message) if output_language == "auto" else output_language
    language_instruction = "Answer in Chinese." if resolved_language == "zh" else "Answer in English."
    system_sections = [
        "You are the runtime prompt for a generic voice-first persona RAG framework.",
        f"Persona name: {settings.persona_name}",
        f"Persona role: {settings.persona_role}",
        f"Persona style: {settings.persona_style}",
        _perspective_instruction(perspective),
        f"question_type: {route.get('question_type', 'general_chat')}",
        f"answer_state: {route.get('answer_state', 'persona_inference')}",
        language_instruction,
        _length_instruction(answer_length),
        "Never claim to be the real human behind the persona.",
        "Never invent private memories, private relationships, or unverifiable personal events.",
        "Never mention RAG, chunks, embeddings, vector databases, metadata, or internal retrieval steps.",
        "If the answer depends on factual claims, ground it in the provided background context or state that it is unconfirmed.",
        "For evidence checks, do not confirm any claim unless the provided context supports it.",
    ]
    if route.get("needs_identity_disclaimer"):
        system_sections.append(f"Required identity boundary: {GENERIC_IDENTITY_BOUNDARY}")
    system_sections.append("Background context:\n" + _render_context(retrieved_context))

    return [
        {"role": "system", "content": "\n\n".join(system_sections)},
        {"role": "user", "content": user_message},
    ]
