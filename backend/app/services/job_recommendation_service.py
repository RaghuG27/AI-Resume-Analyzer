
from app.services.job_match_service import calculate_job_match
from app.services.experience_match_service import (
    extract_minimum_experience,
    extract_seniority,
    calculate_experience_score,
    calculate_seniority_score,
)

SKILL_WEIGHT = 0.50
SEMANTIC_WEIGHT = 0.30
EXPERIENCE_WEIGHT = 0.15
SENIORITY_WEIGHT = 0.05


def calculate_recommendation_score(
    resume_text: str,
    job_description: str,
    semantic_score: float | None = None,
    candidate_experience: float | None = None,
    candidate_seniority: str | None = None,
) -> dict:
    """Calculate the complete candidate-job matching score."""

    skill_result = calculate_job_match(
        resume_text=resume_text,
        job_description=job_description,
    )

    skill_score = skill_result["match_score"]

    required_experience = extract_minimum_experience(
        job_description
    )

    required_seniority = extract_seniority(
        job_description
    )

    experience_score = calculate_experience_score(
        candidate_experience,
        required_experience,
    )

    seniority_score = calculate_seniority_score(
        candidate_seniority,
        required_seniority,
    )

    if semantic_score is not None:
        if not isinstance(semantic_score, (int, float)):
            raise ValueError("Semantic score must be numeric")

        if not 0 <= semantic_score <= 100:
            raise ValueError("Semantic score must be between 0 and 100")

        final_score = (
            skill_score * SKILL_WEIGHT
            + semantic_score * SEMANTIC_WEIGHT
            + experience_score * EXPERIENCE_WEIGHT
            + seniority_score * SENIORITY_WEIGHT
        )

        scoring_method = "weighted_skill_semantic_experience_seniority"

    else:
        available_weight = (
            SKILL_WEIGHT
            + EXPERIENCE_WEIGHT
            + SENIORITY_WEIGHT
        )

        final_score = (
            skill_score * SKILL_WEIGHT
            + experience_score * EXPERIENCE_WEIGHT
            + seniority_score * SENIORITY_WEIGHT
        ) / available_weight

        scoring_method = "skill_experience_seniority_fallback"

    return {
        **skill_result,
        "match_score": round(final_score, 2),
        "skill_match_score": skill_score,
        "semantic_similarity": semantic_score,
        "experience_score": experience_score,
        "seniority_score": seniority_score,
        "required_experience": required_experience,
        "required_seniority": required_seniority,
        "scoring_method": scoring_method,
    }
