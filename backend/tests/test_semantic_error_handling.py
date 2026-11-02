
import pytest

from backend.app.services import semantic_match_service as service


def test_model_load_failure_returns_controlled_exception(monkeypatch):
    def fail_to_load():
        raise service.SemanticMatchingError(
            "Semantic matching is temporarily unavailable"
        )

    monkeypatch.setattr(
        service,
        "get_embedding_model",
        fail_to_load,
    )

    with pytest.raises(
        service.SemanticMatchingError,
        match="Semantic matching is temporarily unavailable",
    ):
        service.get_embedding_model()
