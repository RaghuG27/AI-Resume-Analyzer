from uuid import uuid4

from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_application_routes_are_registered():
    paths = {
        route.path
        for route in app.routes
        if hasattr(route, "path")
    }

    assert "/api/jobs/{job_id}/applications" in paths
    assert "/api/applications/me" in paths


def test_candidate_application_requires_authentication():
    response = client.post(
        f"/api/jobs/{uuid4()}/applications",
        json={
            "cover_letter": "I am interested in this position."
        },
    )

    assert response.status_code in {401, 403}


def test_candidate_application_history_requires_authentication():
    response = client.get("/api/applications/me")

    assert response.status_code == 401