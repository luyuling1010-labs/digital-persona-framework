from __future__ import annotations

import re
from typing import Any


def _route(question_type: str, collections: list[str], **overrides: Any) -> dict[str, Any]:
    route = {
        "question_type": question_type,
        "collections": collections,
        "answer_state": "persona_inference",
        "needs_identity_disclaimer": False,
        "needs_sources": True,
    }
    route.update(overrides)
    return route


def route_question(message: str) -> dict[str, Any]:
    text = re.sub(r"\s+", " ", message or "").strip().lower()

    identity_terms = [
        "are you real",
        "are you the real",
        "are you actually",
        "are you alive",
    ]
    evidence_terms = [
        "source",
        "citation",
        "according to",
        "evidence",
        "verify",
        "supported by",
        "did this persona say",
    ]
    product_terms = ["product", "design", "ux", "feature", "roadmap", "interface", "experience"]

    if any(term in text for term in identity_terms):
        return _route(
            "identity_boundary",
            ["persona_notes"],
            answer_state="boundary",
            needs_identity_disclaimer=True,
            needs_sources=False,
        )
    if any(term in text for term in evidence_terms):
        return _route("evidence_check", ["persona_notes"], answer_state="grounded_check")
    if any(term in text for term in product_terms):
        return _route("product_advice", ["persona_notes"], answer_state="persona_inference")
    return _route("general_chat", ["persona_notes"], needs_sources=False)
