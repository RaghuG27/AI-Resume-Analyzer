
import numpy as np

from backend.app.services import semantic_match_service as service


class FakeBatchEmbeddingModel:
    def encode(self, texts, normalize_embeddings=True):
        assert len(texts) == 3

        return np.array(
            [
                [1.0, 0.0],  # Resume
                [1.0, 0.0],  # Similar job
                [0.0, 1.0],  # Unrelated direction
            ]
        )


def test_batch_similarity_returns_one_score_per_job(monkeypatch):
    monkeypatch.setattr(
        service,
        "get_embedding_model",
        lambda: FakeBatchEmbeddingModel(),
    )

    scores = service.calculate_semantic_similarities(
        resume_text="Python backend developer",
        job_descriptions=[
            "Python API developer",
            "Graphic designer",
        ],
    )

    assert len(scores) == 2
    assert scores[0] == 100.0
    assert scores[1] == 0.0
