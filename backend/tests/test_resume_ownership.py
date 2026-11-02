
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.api.resumes import get_resumes
from backend.app.core.database import Base, get_db
from backend.app.core.security import get_current_user
from backend.app.models.resume import Resume
from backend.app.models.user import User


@pytest.fixture
def resume_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    Base.metadata.create_all(
        engine,
        tables=[User.__table__, Resume.__table__],
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
            is_active=True,
        )
        user_b = User(
            email="candidate-b@example.com",
            password_hash="test-hash-b",
            role="candidate",
            is_active=True,
        )
        db.add_all([user_a, user_b])
        db.flush()

        resume_a = Resume(
            user_id=user_a.id,
            original_filename="candidate-a.pdf",
            stored_filename="resume-a.pdf",
            file_path="uploads/resume-a.pdf",
            raw_text="Resume text for candidate A",
        )
        resume_b = Resume(
            user_id=user_b.id,
            original_filename="candidate-b.pdf",
            stored_filename="resume-b.pdf",
            file_path="uploads/resume-b.pdf",
            raw_text="Resume text for candidate B",
        )
        db.add_all([resume_a, resume_b])
        db.commit()

        user_a_id = user_a.id

    app = FastAPI()
    app.add_api_route(
        "/api/resumes/",
        get_resumes,
        methods=["GET"],
    )

    def override_get_db():
        with TestingSessionLocal() as session:
            yield session

    def override_current_user():
        with TestingSessionLocal() as session:
            user = session.get(User, user_a_id)
            return user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_current_user

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(
        engine,
        tables=[Resume.__table__, User.__table__],
    )
    engine.dispose()


def test_candidate_sees_only_their_own_resumes(resume_client):
    response = resume_client.get("/api/resumes/")

    assert response.status_code == 200

    resumes = response.json()
    filenames = [item["original_filename"] for item in resumes]

    assert "candidate-a.pdf" in filenames
    assert "candidate-b.pdf" not in filenames
    assert len(resumes) == 1
