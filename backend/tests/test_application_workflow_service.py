
import pytest
from fastapi import HTTPException

from backend.app.services.application_workflow_service import (
    validate_application_transition,
)


@pytest.mark.parametrize(
    ("current", "new"),
    [
        ("applied", "reviewing"),
        ("applied", "rejected"),
        ("applied", "withdrawn"),
        ("reviewing", "shortlisted"),
        ("reviewing", "rejected"),
        ("reviewing", "withdrawn"),
        ("shortlisted", "rejected"),
    ],
)
def test_valid_application_transitions(current, new):
    validate_application_transition(current, new)


@pytest.mark.parametrize(
    ("current", "new"),
    [
        ("applied", "shortlisted"),
        ("shortlisted", "withdrawn"),
        ("rejected", "reviewing"),
        ("withdrawn", "applied"),
    ],
)
def test_invalid_application_transitions_are_rejected(current, new):
    with pytest.raises(HTTPException) as exc:
        validate_application_transition(current, new)

    assert exc.value.status_code == 409


def test_unknown_status_is_rejected():
    with pytest.raises(HTTPException) as exc:
        validate_application_transition("unknown", "reviewing")

    assert exc.value.status_code == 409
