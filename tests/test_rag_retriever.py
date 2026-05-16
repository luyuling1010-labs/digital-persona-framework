from backend.rag_retriever import retrieve_context, select_context_for_answer


def test_toy_retriever_returns_source_items() -> None:
    results = retrieve_context("voice subtitles sources", ["persona_notes"], top_k=2)
    selected = select_context_for_answer(results)
    assert selected
    assert {"source_id", "title", "content"}.issubset(selected[0].keys())
