from __future__ import annotations

from backend.config import get_settings
from backend.model_client import generate_response
from backend.prompt_builder import GENERIC_IDENTITY_BOUNDARY, build_prompt, detect_output_language
from backend.question_router import route_question
from backend.rag_retriever import retrieve_context, select_context_for_answer
from backend.safety_checker import check_response


def _prepare_sources(
    context: list[dict],
    include_sources: bool,
    needs_sources: bool,
    show_all_sources: bool,
) -> list[dict]:
    if not include_sources or not needs_sources:
        return []
    seen: set[tuple[str, str]] = set()
    sources: list[dict] = []
    for item in context:
        key = (str(item.get("title", "")), str(item.get("url", "")))
        if key in seen:
            continue
        seen.add(key)
        sources.append(
            {
                "source_id": item.get("source_id", ""),
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "score": item.get("score", 0.0),
                "source_type": item.get("source_type", ""),
                "notes": item.get("notes", ""),
            }
        )
    return sources if show_all_sources else sources[:3]


def run_chat(
    message: str,
    top_k: int = 5,
    perspective: str = "persona_first_person",
    output_mode: str = "text",
    output_language: str = "auto",
    answer_length: str = "medium",
    include_sources: bool = True,
    show_all_sources: bool = False,
    skip_model: bool = False,
    request_timeout: int = 60,
) -> dict:
    settings = get_settings()
    normalized_message = (message or "").strip() or "Hello"
    resolved_output_language = detect_output_language(normalized_message) if output_language == "auto" else output_language

    route = route_question(normalized_message)
    raw_context = retrieve_context(
        query=normalized_message,
        collections=route["collections"],
        top_k=max(top_k, 1),
    )
    prompt_context = select_context_for_answer(raw_context, max_context=3)
    sources = _prepare_sources(
        prompt_context,
        include_sources=include_sources,
        needs_sources=route.get("needs_sources", True),
        show_all_sources=show_all_sources,
    )
    messages = build_prompt(
        user_message=normalized_message,
        route=route,
        retrieved_context=prompt_context,
        perspective=perspective or settings.default_perspective,
        output_language=resolved_output_language,
        answer_length=answer_length,
    )

    if skip_model:
        answer = "[MODEL_SKIPPED_FOR_ROUTE_AND_RETRIEVAL_TEST]"
        warnings = ["model_skipped"]
        risk_flags: list[str] = []
    else:
        answer = generate_response(messages, request_timeout=request_timeout)
        safety = check_response(
            answer,
            route,
            retrieved_context=prompt_context,
            perspective=perspective,
            sources=sources,
            user_message=normalized_message,
        )
        if safety["suggested_prefix"] and not answer.startswith(GENERIC_IDENTITY_BOUNDARY):
            answer = safety["suggested_prefix"] + answer
            safety = check_response(answer, route, retrieved_context=prompt_context, perspective=perspective, sources=sources)
        warnings = safety["warnings"]
        risk_flags = safety.get("risk_flags", [])

    return {
        "answer": answer,
        "subtitle_zh": "",
        "question_type": route["question_type"],
        "collections": route["collections"],
        "answer_state": route["answer_state"],
        "perspective": perspective,
        "output_mode": output_mode,
        "output_language": resolved_output_language,
        "answer_length": answer_length,
        "route": route,
        "retrieved_chunks": raw_context,
        "prompt_context": prompt_context,
        "sources": sources,
        "warnings": warnings,
        "risk_flags": risk_flags,
        "model_skipped": skip_model,
    }
