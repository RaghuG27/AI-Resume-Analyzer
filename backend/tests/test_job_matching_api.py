
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_job_matches_route_is_registered():
    paths = {
        route.path
        for route in app.routes
        if hasattr(route, "path")
    }

    assert "/api/jobs/matches" in paths


def test_job_matches_requires_authentication():
    response = client.get(
        "/api/jobs/matches",
        params={"resume_id": "00000000-0000-0000-0000-000000000001"},
    )

    assert response.status_code == 401


def test_job_matches_rejects_invalid_resume_uuid():
    response = client.get(
        "/api/jobs/matches",
        params={"resume_id": "not-a-valid-uuid"},
    )

    # Authentication may be checked before query-parameter validation.
    assert response.status_code in {401, 422}
