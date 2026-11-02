
from datetime import date

from backend.app.services.experience_extraction_service import (
    extract_candidate_experience,
)


def test_extract_professional_experience():
    resume = """
    PROFESSIONAL EXPERIENCE

    Python Developer
    Jan 2023 - Dec 2024

    Software Engineer
    Jan 2025 - Present

    EDUCATION

    B.E. Computer Science
    2019 - 2023
    """

    result = extract_candidate_experience(
        resume,
        today=date(2026, 10, 1),
    )

    assert result["experience_found"] is True
    assert result["professional_experience_months"] == 46
    assert result["internship_months"] == 0


def test_internship_separated_from_professional_experience():
    resume = """
    EXPERIENCE

    Software Engineer Intern
    Jun 2022 - Dec 2022

    Python Developer
    Jan 2023 - Dec 2024
    """

    result = extract_candidate_experience(
        resume,
        today=date(2026, 10, 1),
    )

    assert result["professional_experience_months"] == 24
    assert result["internship_months"] == 7


def test_overlapping_employment_periods():
    resume = """
    WORK EXPERIENCE

    Python Developer
    Jan 2023 - Dec 2024

    Backend Developer
    Jun 2023 - Dec 2024
    """

    result = extract_candidate_experience(
        resume,
        today=date(2026, 10, 1),
    )

    assert result["professional_experience_months"] == 24


def test_missing_experience_section():
    resume = """
    EDUCATION

    B.E. Computer Science
    2020 - 2024
    """

    result = extract_candidate_experience(resume)

    assert result["experience_found"] is False
    assert result["professional_experience_months"] is None


def test_numeric_date_format():
    resume = """
    EXPERIENCE

    Python Developer
    06/2023 - 05/2024
    """

    result = extract_candidate_experience(
        resume,
        today=date(2026, 10, 1),
    )

    assert result["professional_experience_months"] == 12
