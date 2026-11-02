from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.core.database import get_db
from app.core.csrf import require_csrf
from app.core.security import get_current_user
from app.models import Candidate, Job, RecruitmentApplication, RecruitmentStatusHistory
from app.schemas.recruitment_application import (
    RecruitmentApplicationCreate,
    RecruitmentApplicationRead,
)
from app.schemas.recruitment_board import RecruitmentBoardItem

from app.models.user import User
from app.models.job_application import JobApplication
from app.models.company_membership import CompanyMembership
from app.services.application_workflow_service import (
    validate_application_transition,
)
from app.services.application_history_service import (
    record_application_status_change,
)
from app.services.notification_service import create_notification

class RecruitmentStatusUpdate(BaseModel):
    status: str
    notes: str | None = Field(default=None, max_length=5000)


router = APIRouter(
    prefix="/api/recruitment/applications",
    tags=["Recruitment Applications"],
)


@router.post(
    "/",
    response_model=RecruitmentApplicationRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_csrf)],
)
def create_application(
    payload: RecruitmentApplicationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    candidate = (
        db.query(Candidate)
        .filter(
            Candidate.id == payload.candidate_id,
            Candidate.user_id == current_user.id,
        )
        .first()
    )

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found",
        )

    job = (
        db.query(Job)
        .filter(
            Job.id == payload.job_id,
            Job.user_id == current_user.id,
        )
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    existing = (
        db.query(RecruitmentApplication)
        .filter(
            RecruitmentApplication.user_id == current_user.id,
            RecruitmentApplication.candidate_id == payload.candidate_id,
            RecruitmentApplication.job_id == payload.job_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="This candidate already has an application for this job",
        )

    application = RecruitmentApplication(
        user_id=current_user.id,
        candidate_id=payload.candidate_id,
        job_id=payload.job_id,
        notes=payload.notes,
        status="applied",
    )

    db.add(application)

    db.flush()  # Generates application.id before creating history
    
    db.add(
    RecruitmentStatusHistory(
        application_id=application.id,
        changed_by=current_user.id,
        old_status=None,
        new_status="applied",
        notes="Application created",
    )
    )
    db.commit()
    db.refresh(application)

    return application



@router.get("/", response_model=list[RecruitmentBoardItem])
def list_applications(
    application_status: str | None = Query(default=None, alias="status"),
    job_id: UUID | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can view the recruitment pipeline",
        )

    allowed_statuses = {
        "applied",
        "reviewing",
        "shortlisted",
        "rejected",
        "withdrawn",
    }

    if application_status and application_status not in allowed_statuses:
        raise HTTPException(
            status_code=422,
            detail="Invalid application status",
        )

    active_company_ids = (
        db.query(CompanyMembership.company_id)
        .filter(
            CompanyMembership.user_id == current_user.id,
            CompanyMembership.status == "active",
            CompanyMembership.membership_role.in_(
                ["owner", "recruiter", "hiring_manager"]
            ),
        )
        .subquery()
    )

    query = (
        db.query(JobApplication, Job, User)
        .join(Job, Job.id == JobApplication.job_id)
        .join(User, User.id == JobApplication.user_id)
        .filter(Job.company_id.in_(active_company_ids))
    )

    if application_status:
        query = query.filter(
            JobApplication.status == application_status
        )

    if job_id:
        query = query.filter(JobApplication.job_id == job_id)

    rows = (
        query
        .order_by(JobApplication.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": application.id,
            "candidate_id": candidate.id,
            "candidate_name": candidate.email.split("@")[0],
            "candidate_email": candidate.email,
            "candidate_title": None,
            "job_id": job.id,
            "job_title": job.title,
            "status": application.status,
            "notes": application.cover_letter,
            "created_at": application.created_at,
            "updated_at": application.updated_at,
        }
        for application, job, candidate in rows
    ]


@router.get(
    "/{application_id}",
    response_model=RecruitmentApplicationRead,
)
def get_application(
    application_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    application = (
        db.query(RecruitmentApplication)
        .filter(
            RecruitmentApplication.id == application_id,
            RecruitmentApplication.user_id == current_user.id,
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    return application


ALLOWED_TRANSITIONS = {
    "applied": {"shortlisted", "rejected"},
    "shortlisted": {"interview", "rejected"},
    "interview": {"selected", "rejected"},
    "selected": set(),
    "rejected": set(),
}



@router.patch(
    "/{application_id}/status",
    dependencies=[Depends(require_csrf)],
)
def update_application_status(
    application_id: UUID,
    payload: RecruitmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can update application status",
        )

    application = (
        db.query(JobApplication)
        .join(Job, Job.id == JobApplication.job_id)
        .join(
            CompanyMembership,
            CompanyMembership.company_id == Job.company_id,
        )
        .filter(
            JobApplication.id == application_id,
            CompanyMembership.user_id == current_user.id,
            CompanyMembership.status == "active",
            CompanyMembership.membership_role.in_(
                ["owner", "recruiter", "hiring_manager"]
            ),
        )
        .with_for_update()
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    old_status = application.status
    new_status = payload.status

    validate_application_transition(
        current_status=old_status,
        new_status=new_status,
    )

    candidate = db.get(User, application.user_id)

    try:
        application.status = new_status

        record_application_status_change(
            db,
            application_id=application.id,
            changed_by_user_id=current_user.id,
            old_status=old_status,
            new_status=new_status,
            reason=payload.notes,
        )

        create_notification(
            db,
            user_id=application.user_id,
            notification_type="application_status_changed",
            title="Application status updated",
            message=(
                f"Your application status changed from "
                f"{old_status} to {new_status}."
            ),
        )

        db.commit()
        db.refresh(application)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to update application status",
        )

    return {
        "message": "Application status updated successfully",
        "application_id": str(application.id),
        "old_status": old_status,
        "status": application.status,
        "candidate_email": candidate.email if candidate else None,
    }


@router.get("/{application_id}/history")
def get_application_history(
    application_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    application = (
        db.query(RecruitmentApplication)
        .filter(
            RecruitmentApplication.id == application_id,
            RecruitmentApplication.user_id == current_user.id,
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    history = (
        db.query(RecruitmentStatusHistory)
        .filter(
            RecruitmentStatusHistory.application_id == application.id
        )
        .order_by(RecruitmentStatusHistory.created_at.asc())
        .all()
    )

    return [
        {
            "id": str(item.id),
            "old_status": item.old_status,
            "new_status": item.new_status,
            "changed_by": str(item.changed_by),
            "notes": item.notes,
            "created_at": item.created_at.isoformat(),
        }
        for item in history
    ]