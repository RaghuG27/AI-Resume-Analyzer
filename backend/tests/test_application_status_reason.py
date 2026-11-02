
import pytest
from fastapi import HTTPException


def validate_status_reason(status: str, reason: str | None) -> None:
    if status == "rejected" and not (reason and reason.strip()):
        raise HTTPException(
            status_code=422,
            detail="A reason is required when rejecting an application",
        )


def test_rejection_requires_reason():
    with pytest.raises(HTTPException) as exc:
        validate_status_reason("rejected", None)

    assert exc.value.status_code == 422


def test_blank_rejection_reason_is_rejected():
    with pytest.raises(HTTPException) as exc:
        validate_status_reason("rejected", "   ")

    assert exc.value.status_code == 422


def test_rejection_with_reason_is_valid():
    validate_status_reason("rejected", "Required experience was not demonstrated.")


def test_reviewing_does_not_require_reason():
    validate_status_reason("reviewing", None)
