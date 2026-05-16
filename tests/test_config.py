from backend.config import get_settings


def test_default_provider_is_mock() -> None:
    settings = get_settings()
    assert settings.model_provider
    assert settings.persona_name
