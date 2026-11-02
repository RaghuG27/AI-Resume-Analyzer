
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.core.database import Base, get_db
from backend.app.core.security import get_current_user
from backend.app.api.analysis import get_analysis_status
from backend.app.models.user import User
from backend.app.models.analysis_job import AnalysisJob


@pytest.fixture
def ownership_test_setup():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create only the tables needed by this test.
    Base.metadata.create_all(
        engine,
        tables=[
            User.__table__,
            AnalysisJob.__table__,
        ],
    )

    TestingSessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        expire_on_commit=False,
    )

    with TestingSessionLocal() as db:
        user_a = User(
            email="candidate-a@example.com",
            password_hash="test-hash-a",
            role="candidate",
        )
        user_b = User(
            email="candidate-b@example.com",
            password_hash="test-hash-b",
            role="candidate",
        )

        db.add_all([user_a, user_b])
        db.flush()

        task = AnalysisJob(
            user_id=user_b.id,
            resume_id=__import__("uuid").uuid4(),
            job_id=__import__("uuid").uuid4(),
            celery_task_id="private-task-123",
            status="PENDING",
        )

        db.add(task)
        db.commit()

        user_a_id = user_a.id

    app = FastAPI()
    app.add_api_route(
        "/status/{task_id}",
        get_analysis_status,
        methods=["GET"],
    )

    def override_get_db():
        with TestingSessionLocal() as session:
            yield session

    def override_current_user():
        with TestingSessionLocal() as session:
            return session.get(User, user_a_id)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_current_user

    yield TestClient(app)

    app.dependency_overrides.clear()
    Base.metadata.drop_all(
        engine,
        tables=[
            AnalysisJob.__table__,
            User.__table__,
        ],
    )
    engine.dispose()


def test_user_cannot_access_another_users_analysis_task(
    ownership_test_setup,
):
    client = ownership_test_setup

    response = client.get("/status/private-task-123")

    assert response.status_code == 404
    assert response.json()["detail"] == "Analysis task not found"
