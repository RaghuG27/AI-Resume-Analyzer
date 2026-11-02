
from uuid import uuid4

from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_matching_endpoint_is_registered():
    paths = {
        route.path
        for route in app.routes
        if hasattr(route, "path")
    }

    assert "/api/jobs/matches" in paths


def test_matching_endpoint_requires_authentication():
    response = client.get(
        "/api/jobs/matches",
        params={"resume_id": str(uuid4()), "limit": 10},
    )

    assert response.status_code == 401
