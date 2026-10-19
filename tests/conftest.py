import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_current_user

# Import all models so their tables register with Base.metadata.
from app.models import (
    User,
    Resume,
    Job,
    Analysis,
    Candidate,
    RecruitmentApplication,
    RecruitmentStatusHistory,
)


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    TestingSessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
    )

    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def recruiter(db_session):
    user = User(
        id=uuid.uuid4(),
        email="recruiter@example.com",
        password_hash="test-password-hash",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def other_recruiter(db_session):
    user = User(
        id=uuid.uuid4(),
        email="other@example.com",
        password_hash="test-password-hash",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def client(db_session, recruiter):
    def override_get_db():
        yield db_session

    def override_get_current_user():
        return recruiter

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()