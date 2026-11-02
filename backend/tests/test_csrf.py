
import pytest
from fastapi import FastAPI, Depends, Request
from fastapi.testclient import TestClient

from backend.app.core.csrf import require_csrf, CSRF_COOKIE_NAME


@pytest.fixture
def client():
    app = FastAPI()

    @app.post("/protected", dependencies=[Depends(require_csrf)])
    def protected_endpoint():
        return {"message": "Request accepted"}

    return TestClient(app)


def test_rejects_missing_csrf_token(client):
    response = client.post(
        "/protected",
        headers={"Origin": "http://localhost:3000"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "CSRF token missing"


def test_rejects_mismatched_csrf_token(client):
    response = client.post(
        "/protected",
        headers={
            "Origin": "http://localhost:3000",
            "X-CSRF-Token": "wrong-token",
        },
        cookies={CSRF_COOKIE_NAME: "correct-token"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Invalid CSRF token"


def test_rejects_untrusted_origin(client):
    response = client.post(
        "/protected",
        headers={
            "Origin": "https://untrusted.example",
            "X-CSRF-Token": "test-token",
        },
        cookies={CSRF_COOKIE_NAME: "test-token"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Untrusted request origin"


def test_accepts_matching_token_and_trusted_origin(client):
    response = client.post(
        "/protected",
        headers={
            "Origin": "http://localhost:3000",
            "X-CSRF-Token": "test-token",
        },
        cookies={CSRF_COOKIE_NAME: "test-token"},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Request accepted"
