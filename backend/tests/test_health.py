
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError
from redis.exceptions import RedisError

from backend.app.api import health


class FakeDatabase:
    def __init__(self, should_fail=False):
        self.should_fail = should_fail

    def execute(self, statement):
        if self.should_fail:
            raise SQLAlchemyError("Database unavailable")
        return 1


class FakeRedis:
    def __init__(self, should_fail=False):
        self.should_fail = should_fail
        self.closed = False

    def ping(self):
        if self.should_fail:
            raise RedisError("Redis unavailable")
        return True

    def close(self):
        self.closed = True


def create_test_client(monkeypatch, db_fails=False, redis_fails=False):
    app = FastAPI()
    app.include_router(health.router)

    def override_get_db():
        yield FakeDatabase(should_fail=db_fails)

    app.dependency_overrides[health.get_db] = override_get_db

    fake_redis = FakeRedis(should_fail=redis_fails)

    monkeypatch.setattr(
        health.Redis,
        "from_url",
        lambda *args, **kwargs: fake_redis,
    )

    return TestClient(app), fake_redis


def test_health_endpoint_returns_ok(monkeypatch):
    client, _ = create_test_client(monkeypatch)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_readiness_returns_ready_when_dependencies_are_healthy(monkeypatch):
    client, fake_redis = create_test_client(monkeypatch)

    response = client.get("/ready")

    assert response.status_code == 200
    assert response.json()["status"] == "ready"
    assert response.json()["checks"]["database"] == "ok"
    assert response.json()["checks"]["redis"] == "ok"
    assert fake_redis.closed is True


@pytest.mark.parametrize(
    ("db_fails", "redis_fails", "failed_dependency"),
    [
        (True, False, "database"),
        (False, True, "redis"),
        (True, True, None),
    ],
)
def test_readiness_returns_503_when_dependency_fails(
    monkeypatch,
    db_fails,
    redis_fails,
    failed_dependency,
):
    client, _ = create_test_client(
        monkeypatch,
        db_fails=db_fails,
        redis_fails=redis_fails,
    )

    response = client.get("/ready")

    assert response.status_code == 503

    checks = response.json()["detail"]["checks"]

    if failed_dependency:
        assert checks[failed_dependency] == "unavailable"
    else:
        assert checks["database"] == "unavailable"
        assert checks["redis"] == "unavailable"
