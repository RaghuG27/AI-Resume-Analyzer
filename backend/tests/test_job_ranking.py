
def rank_matches(matches: list[dict], limit: int = 20) -> list[dict]:
    """Rank job matches by score, then newest creation timestamp."""
    if not 1 <= limit <= 100:
        raise ValueError("Limit must be between 1 and 100")

    return sorted(
        matches,
        key=lambda item: (
            item["match_score"],
            item["created_timestamp"],
        ),
        reverse=True,
    )[:limit]


def test_higher_match_score_ranks_first():
    matches = [
        {"job_id": "a", "match_score": 65, "created_timestamp": 100},
        {"job_id": "b", "match_score": 90, "created_timestamp": 50},
        {"job_id": "c", "match_score": 75, "created_timestamp": 200},
    ]

    ranked = rank_matches(matches)

    assert [item["job_id"] for item in ranked] == ["b", "c", "a"]


def test_newer_job_wins_when_scores_tie():
    matches = [
        {"job_id": "older", "match_score": 80, "created_timestamp": 100},
        {"job_id": "newer", "match_score": 80, "created_timestamp": 200},
    ]

    ranked = rank_matches(matches)

    assert [item["job_id"] for item in ranked] == ["newer", "older"]


def test_limit_restricts_number_of_results():
    matches = [
        {"job_id": str(i), "match_score": i, "created_timestamp": i}
        for i in range(10)
    ]

    ranked = rank_matches(matches, limit=3)

    assert len(ranked) == 3
    assert [item["job_id"] for item in ranked] == ["9", "8", "7"]


def test_invalid_limit_is_rejected():
    import pytest

    with pytest.raises(ValueError):
        rank_matches([], limit=0)
