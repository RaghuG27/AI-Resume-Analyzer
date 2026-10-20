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
)
def create_application(
    payload: RecruitmentApplicationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    dependencies=[Depends(require_csrf)]
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
    current_user=Depends(get_current_user),
):
    allowed_statuses = {
        "applied", "shortlisted", "interview", "selected", "rejected"
    }

    if application_status and application_status not in allowed_statuses:
        raise HTTPException(status_code=422, detail="Invalid application status")

    query = (
        db.query(RecruitmentApplication, Candidate, Job)
        .join(
            Candidate,
            Candidate.id == RecruitmentApplication.candidate_id,
        )
        .join(
            Job,
            Job.id == RecruitmentApplication.job_id,
        )
        .filter(
            RecruitmentApplication.user_id == current_user.id,
            Candidate.user_id == current_user.id,
            Job.user_id == current_user.id,
        )
    )

    if application_status:
        query = query.filter(
            RecruitmentApplication.status == application_status
        )

    if job_id:
        query = query.filter(RecruitmentApplication.job_id == job_id)

    rows = (
        query.order_by(RecruitmentApplication.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": application.id,
            "candidate_id": candidate.id,
            "job_id": job.id,
            "candidate_name": candidate.full_name,
            "candidate_email": candidate.email,
            "candidate_title": candidate.current_title,
            "job_title": job.title,
            "status": application.status,
            "notes": application.notes,
            "created_at": application.created_at,
            "updated_at": application.updated_at,
        }
        for application, candidate, job in rows
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


@router.patch("/{application_id}/status")
def update_application_status(
    application_id: UUID,
    payload: RecruitmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    dependencies=[Depends(require_csrf)],
):
    if payload.status not in ALLOWED_TRANSITIONS:
        raise HTTPException(
            status_code=422,
            detail="Invalid recruitment status",
        )

    # Lock the application row to reduce concurrent status-update races.
    application = (
        db.query(RecruitmentApplication)
        .filter(
            RecruitmentApplication.id == application_id,
            RecruitmentApplication.user_id == current_user.id,
        )

        #To prevent concurrent update for same application

        .with_for_update()
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    old_status = application.status

    if payload.status == old_status:
        raise HTTPException(
            status_code=409,
            detail="Application is already in this status",
        )

    if payload.status not in ALLOWED_TRANSITIONS.get(old_status, set()):
        raise HTTPException(
            status_code=409,
            detail=f"Cannot transition from {old_status} to {payload.status}",
        )

    try:
        application.status = payload.status
        application.updated_at = datetime.utcnow()

        history = RecruitmentStatusHistory(
            application_id=application.id,
            changed_by=current_user.id,
            old_status=old_status,
            new_status=payload.status,
            notes=payload.notes,
        )

        db.add(history)
        db.commit()
        db.refresh(application)

        return {
            "message": "Application status updated",
            "application_id": str(application.id),
            "old_status": old_status,
            "new_status": application.status,
        }

    except Exception:
        db.rollback()
        raise

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