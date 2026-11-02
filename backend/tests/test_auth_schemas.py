
import pytest
from pydantic import ValidationError

from backend.app.schemas.auth import RegisterRequest, LoginRequest


def test_registration_accepts_valid_candidate_details():
    request = RegisterRequest(
        email="candidate@example.com",
        password="StrongPassword123!",
    )

    assert request.email == "candidate@example.com"
    assert request.password == "StrongPassword123!"


def test_registration_rejects_role_field():
    with pytest.raises(ValidationError):
        RegisterRequest(
            email="candidate@example.com",
            password="StrongPassword123!",
            role="admin",
        )


def test_registration_rejects_short_password():
    with pytest.raises(ValidationError):
        RegisterRequest(
            email="candidate@example.com",
            password="short",
        )


def test_login_rejects_unexpected_role_field():
    with pytest.raises(ValidationError):
        LoginRequest(
            email="candidate@example.com",
            password="StrongPassword123!",
            role="admin",
        )
