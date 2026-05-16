from fastapi.testclient import TestClient

from backend.app import app


def test_chat_api_returns_generic_response() -> None:
    client = TestClient(app)
    response = client.post(
        "/chat",
        json={
            "message": "What should this product focus on?",
            "output_language": "en",
            "perspective": "persona_first_person",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["answer"]
    assert data["perspective"] == "persona_first_person"
    assert isinstance(data["sources"], list)
