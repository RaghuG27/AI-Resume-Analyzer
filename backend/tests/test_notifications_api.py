
from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_notification_routes_are_registered():
    paths = {
        route.path
        for route in app.routes
        if hasattr(route, "path")
    }

    assert "/api/notifications/me" in paths
    assert "/api/notifications/{notification_id}/read" in paths
    assert "/api/notifications/me/read-all" in paths
