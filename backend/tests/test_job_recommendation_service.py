
from backend.app.services.job_recommendation_service import (
    calculate_recommendation_score,
)


def test_recommendation_with_semantic_score():
    result = calculate_recommendation_score(
        resume_text="Python FastAPI PostgreSQL Docker",
        job_description=(
            "Python FastAPI PostgreSQL Redis "
            "3 years experience"
        ),
        semantic_score=80,
        candidate_experience=3,
        candidate_seniority="mid",
    )

    assert result["match_score"] >= 0
    assert result["match_score"] <= 100
    assert result["semantic_similarity"] == 80
    assert result["scoring_method"] == (
        "weighted_skill_semantic_experience_seniority"
    )


def test_recommendation_without_semantic_score():
    result = calculate_recommendation_score(
        resume_text="Python FastAPI PostgreSQL",
        job_description="Python FastAPI Redis",
        semantic_score=None,
    )

    assert 0 <= result["match_score"] <= 100
    assert result["semantic_similarity"] is None
    assert result["scoring_method"] == (
        "skill_experience_seniority_fallback"
    )


def test_invalid_semantic_score():
    try:
        calculate_recommendation_score(
            resume_text="Python",
            job_description="Python developer",
            semantic_score=150,
        )
    except ValueError:
        pass
    else:
        raise AssertionError("Expected invalid semantic score error")
