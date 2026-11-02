
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from backend.app.core.request_id import RequestIDMiddleware


def create_test_app() -> FastAPI:
    app = FastAPI()
    app.add_middleware(RequestIDMiddleware)

    @app.get("/test")
    def test_endpoint(request: Request):
        return {
            "request_id": request.state.request_id,
        }

    return app


def test_request_id_is_in_response_header():
    client = TestClient(create_test_app())

    response = client.get("/test")

    assert response.status_code == 200
    assert response.headers.get("x-request-id") is not None


def test_request_id_matches_response_body():
    client = TestClient(create_test_app())

    response = client.get("/test")

    assert response.headers["x-request-id"] == response.json()["request_id"]


def test_each_request_gets_a_unique_request_id():
    client = TestClient(create_test_app())

    first_response = client.get("/test")
    second_response = client.get("/test")

    first_id = first_response.headers["x-request-id"]
    second_id = second_response.headers["x-request-id"]

    assert first_id != second_id
