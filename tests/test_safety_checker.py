from backend.safety_checker import check_response


def test_generic_boundary_catches_real_identity_claim() -> None:
    result = check_response("I am the real person.", {"question_type": "identity_boundary"})
    assert "identity_boundary_failed" in result["risk_flags"]


def test_generic_boundary_catches_rag_trace() -> None:
    result = check_response("I found this in retrieved context chunk 3.", {"question_type": "research"})
    assert "rag_trace_leak" in result["risk_flags"]
