
import hashlib
import json
import logging
from functools import lru_cache
from typing import TYPE_CHECKING

import numpy as np
import redis

from app.core.config import settings

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer


logger = logging.getLogger(__name__)

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
CACHE_TTL_SECONDS = 60 * 60 * 24 * 7
CACHE_PREFIX = "resumeai:job_embedding:v1:"


class SemanticMatchingError(Exception):
    """Raised when semantic matching cannot be completed."""


@lru_cache(maxsize=1)
def get_embedding_model() -> "SentenceTransformer":
    """Load the embedding model once per application process."""
    try:
        # Lazy import avoids loading PyTorch when this module is imported.
        from sentence_transformers import SentenceTransformer

        return SentenceTransformer(MODEL_NAME)
    except Exception as exc:
        logger.exception("Failed to load semantic embedding model")
        raise SemanticMatchingError(
            "Semantic matching is temporarily unavailable"
        ) from exc


@lru_cache(maxsize=1)
def get_redis_client():
    """Create and reuse the Redis client."""
    return redis.Redis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=1,
        socket_timeout=1,
    )


def _cache_key(job_description: str) -> str:
    """Generate a stable cache key for a job description."""
    digest = hashlib.sha256(
        job_description.strip().encode("utf-8")
    ).hexdigest()

    return f"{CACHE_PREFIX}{MODEL_NAME}:{digest}"


def is_valid_embedding(
    embedding,
    expected_dimensions: int | None = None,
) -> bool:
    """Validate a finite, non-empty, normalized embedding vector."""
    try:
        vector = np.asarray(embedding, dtype=np.float32)

        if vector.ndim != 1 or vector.size == 0:
            return False

        if expected_dimensions is not None:
            if vector.size != expected_dimensions:
                return False

        if not np.isfinite(vector).all():
            return False

        norm = float(np.linalg.norm(vector))

        return bool(
            np.isclose(norm, 1.0, rtol=1e-3, atol=1e-3)
        )
    except (ValueError, TypeError):
        return False


def _read_cached_embedding(
    job_description: str,
    expected_dimensions: int | None = None,
):
    """Read a valid embedding from Redis, or return None on a cache miss."""
    try:
        cached = get_redis_client().get(_cache_key(job_description))

        if cached is None:
            return None

        vector = np.asarray(json.loads(cached), dtype=np.float32)

        if not is_valid_embedding(vector, expected_dimensions):
            logger.warning(
                "Invalid cached embedding for job description"
            )
            return None

        return vector

    except (redis.RedisError, ValueError, TypeError):
        # Redis is an optimization; a cache failure should not stop matching.
        logger.warning(
            "Failed to read semantic embedding from Redis",
            exc_info=True,
        )
        return None


def _write_cached_embedding(
    job_description: str,
    embedding,
) -> None:
    """Write a valid embedding to Redis."""
    try:
        vector = np.asarray(embedding, dtype=np.float32)

        if not is_valid_embedding(vector):
            logger.warning(
                "Skipping invalid semantic embedding cache write"
            )
            return

        get_redis_client().setex(
            _cache_key(job_description),
            CACHE_TTL_SECONDS,
            json.dumps(vector.tolist()),
        )

    except (redis.RedisError, ValueError, TypeError):
        logger.warning(
            "Failed to cache semantic embedding in Redis",
            exc_info=True,
        )


def _encode_batch(model, texts: list[str]) -> np.ndarray:
    """Encode texts and validate the returned embedding matrix."""
    embeddings = np.asarray(
        model.encode(texts, normalize_embeddings=True),
        dtype=np.float32,
    )

    if embeddings.ndim == 1 and len(texts) == 1:
        embeddings = embeddings.reshape(1, -1)

    if embeddings.ndim != 2:
        raise ValueError("Model returned an invalid embedding matrix")

    if embeddings.shape[0] != len(texts):
        raise ValueError("Model returned an unexpected number of embeddings")

    if embeddings.shape[1] == 0:
        raise ValueError("Model returned empty embeddings")

    for embedding in embeddings:
        if not is_valid_embedding(embedding):
            raise ValueError("Model returned an invalid embedding vector")

    return embeddings


def calculate_semantic_similarities(
    resume_text: str,
    job_descriptions: list[str],
) -> list[float]:
    """
    Calculate semantic similarity scores between one resume and many jobs.

    Returns scores from 0 to 100, in the same order as job_descriptions.
    Raises SemanticMatchingError if model loading or inference fails.
    """
    if not isinstance(resume_text, str) or not resume_text.strip():
        raise ValueError("Resume text cannot be empty")

    if not job_descriptions:
        return []

    if any(
        not isinstance(description, str) or not description.strip()
        for description in job_descriptions
    ):
        raise ValueError("Job descriptions cannot be empty")

    descriptions = [
        description.strip() for description in job_descriptions
    ]

    # The loader already converts model-loading errors into the controlled
    # exception. Do not catch and rewrap SemanticMatchingError here.
    model = get_embedding_model()

    try:
        # Encode the resume.
        resume_embedding = _encode_batch(
            model,
            [resume_text.strip()],
        )[0]

        # Read cached job embeddings.
        cached_embeddings = [
            _read_cached_embedding(
                description,
                expected_dimensions=resume_embedding.size,
            )
            for description in descriptions
        ]

        # Batch-encode descriptions that are missing from the cache.
        missing_indices = [
            index
            for index, embedding in enumerate(cached_embeddings)
            if embedding is None
        ]

        if missing_indices:
            missing_descriptions = [
                descriptions[index] for index in missing_indices
            ]

            new_embeddings = _encode_batch(
                model,
                missing_descriptions,
            )

            for index, embedding in zip(
                missing_indices,
                new_embeddings,
            ):
                cached_embeddings[index] = embedding
                _write_cached_embedding(
                    descriptions[index],
                    embedding,
                )

        # Compute cosine similarity using normalized vectors.
        scores = []

        for index, job_embedding in enumerate(cached_embeddings):
            if not is_valid_embedding(
                job_embedding,
                expected_dimensions=resume_embedding.size,
            ):
                # Defensive fallback if an embedding is unexpectedly invalid.
                job_embedding = _encode_batch(
                    model,
                    [descriptions[index]],
                )[0]

                _write_cached_embedding(
                    descriptions[index],
                    job_embedding,
                )

            similarity = float(np.dot(resume_embedding, job_embedding))
            score = max(0.0, min(100.0, similarity * 100.0))
            scores.append(round(score, 2))

        return scores

    except SemanticMatchingError:
        raise

    except Exception as exc:
        logger.exception("Semantic embedding generation failed")
        raise SemanticMatchingError(
            "Semantic matching is temporarily unavailable"
        ) from exc


def calculate_semantic_similarity(
    resume_text: str,
    job_description: str,
) -> dict:
    """Calculate the semantic similarity score for one job."""
    scores = calculate_semantic_similarities(
        resume_text,
        [job_description],
    )

    return {
        "semantic_similarity": scores[0],
        "model": MODEL_NAME,
    }
