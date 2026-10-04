from app.schemas.analysis import RequirementAnalysis


def clamp_score(score: float) -> int:
    """
    Keep score between 0 and 100.
    """
    return max(0, min(round(score), 100))


def importance_weight(importance: str) -> float:
    """
    Required requirements have more impact
    than preferred requirements.
    """

    if importance == "required":
        return 1.0

    if importance == "preferred":
        return 0.5

    # Fallback for unexpected values
    return 0.75


def calculate_requirement_score(
    requirements: list[RequirementAnalysis],
) -> int:
    """
    Calculate a weighted score for a group of requirements.

    Example:

    Python       → matched → relevance 95
    FastAPI      → matched → relevance 90
    Redis        → missing → 0

    Required requirements have weight 1.0.
    Preferred requirements have weight 0.5.
    """

    if not requirements:
        return 100

    total_weight = 0.0
    weighted_score = 0.0

    for requirement in requirements:

        weight = importance_weight(
            requirement.importance
        )

        # If requirement isn't matched,
        # it contributes zero.
        if requirement.matched:
            score = requirement.relevance
        else:
            score = 0

        weighted_score += score * weight
        total_weight += weight

    if total_weight == 0:
        return 100

    final_score = weighted_score / total_weight

    return clamp_score(final_score)


def calculate_category_score(
    requirements: list[RequirementAnalysis],
    category: str,
) -> int:
    """
    Calculate score for one category.

    Example:

    category="skill"

    will only evaluate skill requirements.
    """

    category_requirements = [
        requirement
        for requirement in requirements
        if requirement.category == category
    ]

    return calculate_requirement_score(
        category_requirements
    )


def calculate_scores(
    requirements: list[RequirementAnalysis],
) -> dict[str, int]:
    """
    Calculate all component scores.
    """

    skill_score = calculate_category_score(
        requirements,
        "skill",
    )

    experience_score = calculate_category_score(
        requirements,
        "experience",
    )

    responsibility_score = calculate_category_score(
        requirements,
        "responsibility",
    )

    ats_score = calculate_category_score(
        requirements,
        "keyword",
    )

    education_score = calculate_category_score(
        requirements,
        "education",
    )

    return {
        "skill_score": skill_score,
        "experience_score": experience_score,
        "responsibility_score": responsibility_score,
        "ats_score": ats_score,
        "education_score": education_score,
    }


def calculate_overall_score(
    scores: dict[str, int],
) -> int:
    """
    Calculate final resume-job match score.

    Weights:

    Skills             35%
    Experience         25%
    Responsibilities   20%
    ATS                 10%
    Education           10%
    """

    overall_score = (
        scores["skill_score"] * 0.35
        + scores["experience_score"] * 0.25
        + scores["responsibility_score"] * 0.20
        + scores["ats_score"] * 0.10
        + scores["education_score"] * 0.10
    )

    return clamp_score(overall_score)


def calculate_all_scores(
    requirements: list[RequirementAnalysis],
) -> dict[str, int]:
    """
    Main scoring function.

    Returns component scores + final score.
    """

    scores = calculate_scores(
        requirements
    )

    overall_score = calculate_overall_score(
        scores
    )

    return {
        **scores,
        "overall_score": overall_score,
    }