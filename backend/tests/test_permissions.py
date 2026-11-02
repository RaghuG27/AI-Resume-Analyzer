
import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from backend.app.core.permissions import require_roles
from backend.app.core.security import get_current_user
from backend.app.models.user import User


def create_test_client(user_role: str) -> TestClient:
    app = FastAPI()

    @app.get("/recruiter-only")
    def recruiter_endpoint(
        current_user: User = Depends(require_roles("recruiter")),
    ):
        return {
            "message": "Access granted",
            "role": current_user.role,
        }

    @app.get("/candidate-or-recruiter")
    def shared_endpoint(
        current_user: User = Depends(
            require_roles("candidate", "recruiter")
        ),
    ):
        return {"role": current_user.role}

    test_user = User(
        email="test@example.com",
        password_hash="test-hash",
        role=user_role,
    )

    app.dependency_overrides[get_current_user] = lambda: test_user

    return TestClient(app)


def test_recruiter_can_access_recruiter_endpoint():
    client = create_test_client("recruiter")

    response = client.get("/recruiter-only")

    assert response.status_code == 200
    assert response.json()["role"] == "recruiter"


@pytest.mark.parametrize("role", ["candidate", "admin"])
def test_non_recruiter_cannot_access_recruiter_endpoint(role):
    client = create_test_client(role)

    response = client.get("/recruiter-only")

    assert response.status_code == 403


@pytest.mark.parametrize("role", ["candidate", "recruiter"])
def test_multiple_allowed_roles_can_access_shared_endpoint(role):
    client = create_test_client(role)

    response = client.get("/candidate-or-recruiter")

    assert response.status_code == 200
    assert response.json()["role"] == role


def test_invalid_role_configuration_is_rejected():
    with pytest.raises(ValueError):
        require_roles("superadmin")


def test_empty_role_configuration_is_rejected():
    with pytest.raises(ValueError):
        require_roles()
