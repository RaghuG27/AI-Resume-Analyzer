
from backend.app.services.experience_match_service import (
    extract_minimum_experience,
    extract_seniority,
    calculate_experience_score,
    calculate_seniority_score,
)


def test_extract_experience():
    assert extract_minimum_experience(
        "Required 3+ years of Python experience"
    ) == 3.0


def test_extract_experience_not_found():
    assert extract_minimum_experience(
        "Looking for a Python developer"
    ) is None


def test_extract_seniority():
    assert extract_seniority(
        "We are hiring a Senior Python Developer"
    ) == "senior"


def test_experience_score_sufficient():
    assert calculate_experience_score(4, 3) == 100


def test_experience_score_partial():
    assert calculate_experience_score(2, 4) == 50


def test_experience_score_missing_candidate_data():
    assert calculate_experience_score(None, 3) == 50


def test_seniority_exact_match():
    assert calculate_seniority_score("mid", "mid") == 100


def test_seniority_candidate_is_more_experienced():
    assert calculate_seniority_score("senior", "mid") == 90


def test_seniority_candidate_is_less_experienced():
    assert calculate_seniority_score("junior", "senior") == 50
