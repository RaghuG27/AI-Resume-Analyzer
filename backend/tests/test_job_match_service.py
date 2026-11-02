
from backend.app.services.job_match_service import (
    extract_skills,
    calculate_job_match,
)


def test_extract_skills():
    text = """
    Python developer with FastAPI, PostgreSQL,
    Redis, Docker, and Generative AI experience.
    """

    skills = extract_skills(text)

    assert "python" in skills
    assert "fastapi" in skills
    assert "postgresql" in skills
    assert "redis" in skills
    assert "docker" in skills
    assert "generative ai" in skills


def test_calculate_job_match():
    resume = """
    Python, FastAPI, PostgreSQL, Docker
    """

    job = """
    Python, FastAPI, PostgreSQL, Redis
    """

    result = calculate_job_match(resume, job)

    assert result["match_score"] == 75
    assert result["matched_skills"] == [
        "fastapi",
        "postgresql",
        "python",
    ]
    assert result["missing_skills"] == ["redis"]


def test_empty_resume():
    result = calculate_job_match(
        "",
        "Python FastAPI PostgreSQL",
    )

    assert result["match_score"] == 0
    assert result["matched_skills"] == []


def test_job_without_detectable_skills():
    result = calculate_job_match(
        "Python developer",
        "Looking for a motivated professional.",
    )

    assert result["match_score"] == 0
    assert result["required_skills"] == []
