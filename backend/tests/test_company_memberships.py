import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.core.database import Base, get_db
from backend.app.core.security import get_current_user
from backend.app.core.csrf import require_csrf

# Import models so their tables are registered with Base.metadata.
from backend.app.models.user import User
from backend.app.models.company import Company
from backend.app.models.company_membership import CompanyMembership


TEST_DATABASE_URL = "sqlite://"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # These tests focus on endpoint authorization and business logic.
    # CSRF behavior should also have dedicated tests.
    app.dependency_overrides[require_csrf] = lambda: None

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def create_user(db, role="candidate", email=None):
    user = User(
        email=email or f"{uuid.uuid4()}@example.com",
        password_hash="test-password-hash",
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def set_authenticated_user(user):
    app.dependency_overrides[get_current_user] = lambda: user


def test_candidate_cannot_list_pending_memberships(client, db_session):
    candidate = create_user(db_session, role="candidate")
    set_authenticated_user(candidate)

    response = client.get("/api/companies/admin/pending-memberships")

    assert response.status_code == 403


def test_admin_can_list_pending_memberships(client, db_session):
    admin = create_user(db_session, role="admin")
    owner = create_user(db_session, role="recruiter")

    company = Company(
        name="Example Technologies",
        created_by_user_id=owner.id,
    )
    db_session.add(company)
    db_session.flush()

    membership = CompanyMembership(
        user_id=owner.id,
        company_id=company.id,
        membership_role="owner",
        status="pending",
    )
    db_session.add(membership)
    db_session.commit()

    set_authenticated_user(admin)

    response = client.get("/api/companies/admin/pending-memberships")

    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["membership_id"] == str(membership.id)
    assert results[0]["company_name"] == "Example Technologies"
    assert results[0]["status"] == "pending"


def test_admin_can_approve_another_users_pending_membership(
    client, db_session
):
    admin = create_user(db_session, role="admin")
    owner = create_user(db_session, role="recruiter")

    company = Company(
        name="Approval Test Company",
        created_by_user_id=owner.id,
    )
    db_session.add(company)
    db_session.flush()

    membership = CompanyMembership(
        user_id=owner.id,
        company_id=company.id,
        membership_role="owner",
        status="pending",
    )
    db_session.add(membership)
    db_session.commit()

    set_authenticated_user(admin)

    response = client.post(
        f"/api/companies/admin/memberships/{membership.id}/approve"
    )

    assert response.status_code == 200
    assert response.json()["status"] == "active"

    db_session.refresh(membership)
    assert membership.status == "active"


def test_admin_cannot_approve_own_membership(client, db_session):
    admin = create_user(db_session, role="admin")

    company = Company(
        name="Admin-Owned Company",
        created_by_user_id=admin.id,
    )
    db_session.add(company)
    db_session.flush()

    membership = CompanyMembership(
        user_id=admin.id,
        company_id=company.id,
        membership_role="owner",
        status="pending",
    )
    db_session.add(membership)
    db_session.commit()

    set_authenticated_user(admin)

    response = client.post(
        f"/api/companies/admin/memberships/{membership.id}/approve"
    )

    assert response.status_code == 403

    db_session.refresh(membership)
    assert membership.status == "pending"


def test_cannot_approve_membership_twice(client, db_session):
    admin = create_user(db_session, role="admin")
    owner = create_user(db_session, role="recruiter")

    company = Company(
        name="Already Approved Company",
        created_by_user_id=owner.id,
    )
    db_session.add(company)
    db_session.flush()

    membership = CompanyMembership(
        user_id=owner.id,
        company_id=company.id,
        membership_role="owner",
        status="active",
    )
    db_session.add(membership)
    db_session.commit()

    set_authenticated_user(admin)

    response = client.post(
        f"/api/companies/admin/memberships/{membership.id}/approve"
    )

    assert response.status_code == 409