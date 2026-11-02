
from fastapi import HTTPException, status


ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "applied": {"reviewing", "rejected", "withdrawn"},
    "reviewing": {"shortlisted", "rejected", "withdrawn"},
    "shortlisted": {"rejected"},
    "rejected": set(),
    "withdrawn": set(),
}


def validate_application_transition(
    current_status: str,
    new_status: str,
) -> None:
    """Reject invalid job application status transitions."""

    allowed = ALLOWED_TRANSITIONS.get(current_status)

    if allowed is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Current application status is invalid",
        )

    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot change application status "
                f"from '{current_status}' to '{new_status}'"
            ),
        )
