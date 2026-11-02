
from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_application_history_route_is_registered():
    paths = {
        route.path
        for route in app.routes
        if hasattr(route, "path")
    }

    assert "/api/applications/{application_id}/history" in paths
