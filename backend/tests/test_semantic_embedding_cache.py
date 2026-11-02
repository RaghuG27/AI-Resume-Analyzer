
import numpy as np

from backend.app.services import semantic_match_service as service


class FakeRedis:
    def __init__(self):
        self.values = {}
        self.reads = 0
        self.writes = 0

    def get(self, key):
        self.reads += 1
        return self.values.get(key)

    def setex(self, key, ttl, value):
        self.writes += 1
        self.values[key] = value


class FakeModel:
    def __init__(self):
        self.encoded_texts = []

    def encode(self, texts, normalize_embeddings=True):
        if isinstance(texts, str):
            self.encoded_texts.append(texts)
            return np.array([1.0, 0.0], dtype=np.float32)

        self.encoded_texts.extend(texts)

        return np.array(
            [[1.0, 0.0] for _ in texts],
            dtype=np.float32,
        )


def test_job_embedding_is_reused_from_cache(monkeypatch):
    fake_redis = FakeRedis()
    fake_model = FakeModel()

    monkeypatch.setattr(
        service,
        "get_redis_client",
        lambda: fake_redis,
    )
    monkeypatch.setattr(
        service,
        "get_embedding_model",
        lambda: fake_model,
    )

    first = service.calculate_semantic_similarities(
        "Python developer",
        ["Python backend engineer"],
    )

    first_job_encodings = fake_model.encoded_texts.count(
        "Python backend engineer"
    )

    second = service.calculate_semantic_similarities(
        "Another Python developer",
        ["Python backend engineer"],
    )

    second_job_encodings = fake_model.encoded_texts.count(
        "Python backend engineer"
    )

    assert first == [100.0]
    assert second == [100.0]
    assert first_job_encodings == 1
    assert second_job_encodings == 1
    assert fake_redis.writes == 1


def test_empty_job_list_returns_empty_scores():
    assert service.calculate_semantic_similarities(
        "Python developer",
        [],
    ) == []
