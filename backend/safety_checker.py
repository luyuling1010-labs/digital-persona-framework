from __future__ import annotations

import re
from typing import Any

from backend.prompt_builder import GENERIC_IDENTITY_BOUNDARY


RAG_TRACE_PATTERNS = [
    r"\brag\b",
    r"\bchunk(s)?\b",
    r"\bembedding(s)?\b",
    r"\bvector database\b",
    r"\bmetadata\b",
    r"\bretrieved context\b",
]

REAL_IDENTITY_PATTERNS = [
    "i am the real",
    "i am actually",
    "i came back to life",
    "i am alive again",
]

PRIVATE_MEMORY_PATTERNS = [
    "i remember the private day",
    "in my private life",
    "my private memory",
    "before i died",
]


def _contains_any(text: str, patterns: list[str]) -> bool:
    lowered = (text or "").lower()
    return any(pattern.lower() in lowered for pattern in patterns)


def _contains_rag_trace(text: str) -> bool:
    lowered = (text or "").lower()
    return any(re.search(pattern, lowered) for pattern in RAG_TRACE_PATTERNS)


def check_response(
    response: str,
    route: dict[str, Any],
    retrieved_context: list[dict[str, Any]] | None = None,
    perspective: str = "persona_first_person",
    sources: list[dict[str, Any]] | None = None,
    user_message: str = "",
) -> dict[str, Any]:
    del retrieved_context, perspective, sources, user_message
    warnings: list[str] = []
    risk_flags: list[str] = []

    if _contains_any(response, REAL_IDENTITY_PATTERNS):
        warnings.append("The response may blur the boundary between simulation and real person.")
        risk_flags.append("identity_boundary_failed")

    if _contains_rag_trace(response):
        warnings.append("The response may expose internal retrieval or storage details.")
        risk_flags.append("rag_trace_leak")

    if _contains_any(response, PRIVATE_MEMORY_PATTERNS):
        warnings.append("The response may imply unverifiable private memory.")
        risk_flags.append("private_memory_slip")

    if route.get("needs_identity_disclaimer") and GENERIC_IDENTITY_BOUNDARY not in response:
        warnings.append("The response needs a clear digital-persona boundary.")
        risk_flags.append("identity_boundary_missing")

    severe = {"identity_boundary_failed", "rag_trace_leak", "private_memory_slip", "identity_boundary_missing"}
    suggested_prefix = f"{GENERIC_IDENTITY_BOUNDARY} " if route.get("needs_identity_disclaimer") else ""
    return {
        "passed": not any(flag in severe for flag in risk_flags),
        "warnings": sorted(set(warnings)),
        "risk_flags": sorted(set(risk_flags)),
        "suggested_prefix": suggested_prefix if "identity_boundary_missing" in risk_flags else "",
    }
