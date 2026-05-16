from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from backend.config import REPO_ROOT, get_settings


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9_]+|[\u4e00-\u9fff]{2,}", (text or "").lower()))


def _load_demo_notes() -> list[dict[str, Any]]:
    settings = get_settings()
    path = Path(settings.persona_data_path)
    if not path.is_absolute():
        path = REPO_ROOT / path
    if not path.exists():
        return []

    content = path.read_text(encoding="utf-8")
    sections = [part.strip() for part in re.split(r"\n(?=## )", content) if part.strip()]
    results: list[dict[str, Any]] = []
    for index, section in enumerate(sections, start=1):
        first_line = section.splitlines()[0].replace("#", "").strip()
        results.append(
            {
                "source_id": f"toy-persona-{index}",
                "title": first_line or "Toy persona note",
                "url": "",
                "content": section,
                "source_type": "toy_persona_note",
                "notes": "demo placeholder; replace with your own persona data",
                "score": 0.0,
            }
        )
    return results


def retrieve_context(query: str, collections: list[str], top_k: int = 5) -> list[dict[str, Any]]:
    del collections
    records = _load_demo_notes()
    query_tokens = _tokenize(query)
    ranked: list[dict[str, Any]] = []
    for record in records:
        record_tokens = _tokenize(f"{record.get('title', '')} {record.get('content', '')}")
        overlap = len(query_tokens & record_tokens)
        ranked.append({**record, "score": float(overlap)})
    ranked.sort(key=lambda item: item["score"], reverse=True)
    return ranked[:top_k]


def select_context_for_answer(results: list[dict[str, Any]], max_context: int = 3) -> list[dict[str, Any]]:
    return results[:max_context]
