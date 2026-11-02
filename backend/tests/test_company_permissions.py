import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.core.database import Base, get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.models.company import Company
from backend.app.models.company_membership import CompanyMembership


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


@pytest.fixture
def db_session():
    # Create only the tables needed by these tests.
    User.__table__.create(engine)
    Company.__table__.create(engine)
    CompanyMembership.__table__.create(engine)

    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        CompanyMembership.__table__.drop(engine)
        Company.__table__.drop(engine)
        User.__table__.drop(engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def make_user(db, role="recruiter"):
    user = User(
        email=f"{uuid.uuid4()}@example.com",
        password_hash="test-password-hash",
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def make_company(db, owner):
    company = Company(
        name=f"Company {uuid.uuid4().hex[:8]}",
        created_by_user_id=owner.id,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def add_membership(db, user, company, role, status):
    membership = CompanyMembership(
        user_id=user.id,
        company_id=company.id,
        membership_role=role,
        status=status,
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def authenticate(user):
    app.dependency_overrides[get_current_user] = lambda: user


def permissions_url(company):
    return f"/api/companies/{company.id}/jobs/permissions"


def test_active_owner_can_manage_jobs(client, db_session):
    owner = make_user(db_session)
    company = make_company(db_session, owner)
    add_membership(db_session, owner, company, "owner", "active")
    authenticate(owner)

    response = client.get(permissions_url(company))

    assert response.status_code == 200
    assert response.json()["can_manage_jobs"] is True
    assert response.json()["membership_role"] == "owner"


def test_active_recruiter_can_manage_jobs(client, db_session):
    owner = make_user(db_session)
    recruiter = make_user(db_session)
    company = make_company(db_session, owner)
    add_membership(db_session, recruiter, company, "recruiter", "active")
    authenticate(recruiter)

    response = client.get(permissions_url(company))

    assert response.status_code == 200
    assert response.json()["membership_role"] == "recruiter"


def test_hiring_manager_cannot_manage_jobs_on_this_endpoint(
    client, db_session
):
    owner = make_user(db_session)
    hiring_manager = make_user(db_session)
    company = make_company(db_session, owner)
    add_membership(
        db_session, hiring_manager, company, "hiring_manager", "active"
    )
    authenticate(hiring_manager)

    response = client.get(permissions_url(company))

    assert response.status_code == 403


@pytest.mark.parametrize("membership_status", ["pending", "revoked"])
def test_inactive_membership_is_denied(
    client, db_session, membership_status
):
    owner = make_user(db_session)
    recruiter = make_user(db_session)
    company = make_company(db_session, owner)
    add_membership(
        db_session, recruiter, company, "recruiter", membership_status
    )
    authenticate(recruiter)

    response = client.get(permissions_url(company))

    assert response.status_code == 404


def test_user_cannot_access_another_company(client, db_session):
    owner_a = make_user(db_session)
    owner_b = make_user(db_session)
    recruiter_a = make_user(db_session)

    company_a = make_company(db_session, owner_a)
    company_b = make_company(db_session, owner_b)

    add_membership(
        db_session, recruiter_a, company_a, "recruiter", "active"
    )
    authenticate(recruiter_a)

    response = client.get(permissions_url(company_b))

    assert response.status_code == 404