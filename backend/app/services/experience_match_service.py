
import re


EXPERIENCE_PATTERNS = [
    r"(\d+(?:\.\d+)?)\s*\+?\s*years?",
    r"(\d+(?:\.\d+)?)\s*\+?\s*yrs?",
    r"minimum\s+of\s+(\d+(?:\.\d+)?)\s*years?",
]


SENIORITY_KEYWORDS = {
    "intern": ["intern", "internship"],
    "junior": ["junior", "entry level", "entry-level", "fresher"],
    "mid": ["mid-level", "mid level", "intermediate"],
    "senior": ["senior", "sr.", "sr "],
    "lead": ["lead", "team lead", "technical lead"],
    "principal": ["principal", "architect"],
}


def extract_minimum_experience(text: str) -> float | None:
    """Extract the minimum experience requirement from text."""

    if not text:
        return None

    normalized = text.lower()

    matches = []

    for pattern in EXPERIENCE_PATTERNS:
        for match in re.finditer(pattern, normalized):
            matches.append(float(match.group(1)))

    if not matches:
        return None

    return min(matches)


def extract_seniority(text: str) -> str | None:
    """Identify seniority from job or resume text."""

    if not text:
        return None

    normalized = text.lower()

    for level, keywords in SENIORITY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in normalized:
                return level

    return None


def calculate_experience_score(
    candidate_experience: float | None,
    required_experience: float | None,
) -> int:
    """
    Compare candidate experience against job requirements.

    Missing information is neutral rather than an automatic failure.
    """

    if required_experience is None:
        return 100

    if candidate_experience is None:
        return 50

    if required_experience <= 0:
        return 100

    if candidate_experience >= required_experience:
        return 100

    return round(
        (candidate_experience / required_experience) * 100
    )


def calculate_seniority_score(
    candidate_level: str | None,
    required_level: str | None,
) -> int:
    """Compare candidate and job seniority."""

    levels = {
        "intern": 0,
        "junior": 1,
        "mid": 2,
        "senior": 3,
        "lead": 4,
        "principal": 5,
    }

    if required_level is None or candidate_level is None:
        return 50

    candidate_rank = levels.get(candidate_level)
    required_rank = levels.get(required_level)

    if candidate_rank is None or required_rank is None:
        return 50

    difference = candidate_rank - required_rank

    if difference == 0:
        return 100

    if difference > 0:
        return 90

    return max(0, 100 - abs(difference) * 25)
