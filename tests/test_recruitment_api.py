import uuid

import pytest

from app.models import (
    Candidate,
    Job,
    RecruitmentApplication,
    RecruitmentStatusHistory,
)


@pytest.fixture()
def candidate_and_job(db_session, recruiter):
    candidate = Candidate(
        user_id=recruiter.id,
        full_name="Test Candidate",
        email="candidate@example.com",
        skills=["Python", "FastAPI"],
    )

    job = Job(
        user_id=recruiter.id,
        title="Python Developer",
        description="Build backend APIs",
    )

    db_session.add_all([candidate, job])
    db_session.commit()
    db_session.refresh(candidate)
    db_session.refresh(job)

    return candidate, job


def test_create_application(client, candidate_and_job):
    candidate, job = candidate_and_job

    response = client.post(
        "/api/recruitment/applications/",
        json={
            "candidate_id": str(candidate.id),
            "job_id": str(job.id),
            "notes": "Strong backend experience",
        },
    )

    assert response.status_code == 201
    assert response.json()["status"] == "applied"


def test_cannot_apply_another_recruiters_candidate(
    client,
    db_session,
    other_recruiter,
    candidate_and_job,
):
    _, job = candidate_and_job

    foreign_candidate = Candidate(
        user_id=other_recruiter.id,
        full_name="Private Candidate",
        skills=[],
    )

    db_session.add(foreign_candidate)
    db_session.commit()
    db_session.refresh(foreign_candidate)

    response = client.post(
        "/api/recruitment/applications/",
        json={
            "candidate_id": str(foreign_candidate.id),
            "job_id": str(job.id),
        },
    )

    assert response.status_code == 404


def test_rejects_invalid_status_transition(
    client,
    db_session,
    recruiter,
    candidate_and_job,
):
    candidate, job = candidate_and_job

    application = RecruitmentApplication(
        user_id=recruiter.id,
        candidate_id=candidate.id,
        job_id=job.id,
        status="applied",
    )

    db_session.add(application)
    db_session.commit()
    db_session.refresh(application)

    response = client.patch(
        f"/api/recruitment/applications/{application.id}/status",
        json={"status": "selected"},
    )

    assert response.status_code == 409

    db_session.refresh(application)
    assert application.status == "applied"


def test_status_change_creates_history(
    client,
    db_session,
    recruiter,
    candidate_and_job,
):
    candidate, job = candidate_and_job

    application = RecruitmentApplication(
        user_id=recruiter.id,
        candidate_id=candidate.id,
        job_id=job.id,
        status="applied",
    )

    db_session.add(application)
    db_session.commit()
    db_session.refresh(application)

    response = client.patch(
        f"/api/recruitment/applications/{application.id}/status",
        json={
            "status": "shortlisted",
            "notes": "Meets required skills",
        },
    )

    assert response.status_code == 200

    db_session.refresh(application)
    assert application.status == "shortlisted"

    history = (
        db_session.query(RecruitmentStatusHistory)
        .filter(
            RecruitmentStatusHistory.application_id == application.id
        )
        .all()
    )

    assert len(history) == 1
    assert history[0].old_status == "applied"
    assert history[0].new_status == "shortlisted"