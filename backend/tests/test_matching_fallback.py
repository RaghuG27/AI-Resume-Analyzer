
from backend.app.services.job_match_service import calculate_job_match


def test_skill_only_fallback_returns_valid_score():
    result = calculate_job_match(
        resume_text="Python FastAPI PostgreSQL",
        job_description="Python FastAPI PostgreSQL Docker Redis",
    )

    assert result["match_score"] == 60
    assert result["scoring_method"] == "skill_overlap"
