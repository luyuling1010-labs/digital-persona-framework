from backend.model_client import generate_response


def test_mock_model_returns_response() -> None:
    answer = generate_response(
        [
            {"role": "system", "content": "question_type: product_advice"},
            {"role": "user", "content": "What should this product focus on?"},
        ]
    )
    assert "voice-first" in answer.lower() or "product" in answer.lower()
