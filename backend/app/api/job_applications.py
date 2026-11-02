
from uuid import UUID
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.csrf import require_csrf
from app.core.company_permissions import require_company_membership

from app.models.user import User
from app.models.job import Job
from app.models.company import Company
from app.models.job_application import JobApplication
from app.models.company_membership import CompanyMembership

from app.schemas.job_application import (
    JobApplicationCreate,
    JobApplicationResponse,
    CandidateApplicationResponse,
    CompanyApplicationResponse,
    ApplicationStatusUpdate,
)

from app.services.application_workflow_service import (
    validate_application_transition,
)

from app.services.application_history_service import (
    record_application_status_change,
)

from app.models.application_status_history import ApplicationStatusHistory
from app.schemas.application_history import ApplicationStatusHistoryResponse
from app.services.notification_service import create_notification

from app.services.outbox_service import enqueue_outbox_event

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["Job Applications"],
)


@router.post(
    "/jobs/{job_id}/applications",
    response_model=JobApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_csrf)],
)
def apply_for_job(
    job_id: UUID,
    request: JobApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a job application as a candidate."""

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can apply for jobs",
        )

    job = db.get(Job, job_id)

    if job is None or job.status != "published" or job.company_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Published job not found",
        )

    cover_letter = (
        request.cover_letter.strip()
        if request.cover_letter is not None
        else None
    )

    if cover_letter == "":
        cover_letter = None

    application = JobApplication(
        job_id=job.id,
        user_id=current_user.id,
        cover_letter=cover_letter,
        status="applied",
    )

    try:
        db.add(application)
        db.commit()
        db.refresh(application)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied for this job",
        )

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit application",
        )

    return application


@router.get(
    "/applications/me",
    response_model=list[CandidateApplicationResponse],
)
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return applications belonging to the authenticated candidate."""

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can view candidate application history",
        )

    rows = (
        db.query(JobApplication, Job, Company)
        .join(Job, Job.id == JobApplication.job_id)
        .join(Company, Company.id == Job.company_id)
        .filter(JobApplication.user_id == current_user.id)
        .order_by(JobApplication.created_at.desc())
        .all()
    )

    return [
        CandidateApplicationResponse(
            id=application.id,
            job_id=application.job_id,
            user_id=application.user_id,
            status=application.status,
            cover_letter=application.cover_letter,
            created_at=application.created_at,
            updated_at=application.updated_at,
            job_title=job.title,
            company_id=company.id,
            company_name=company.name,
        )
        for application, job, company in rows
    ]


@router.get(
    "/companies/{company_id}/applications",
    response_model=list[CompanyApplicationResponse],
)
def get_company_applications(
    company_id: UUID,
    db: Session = Depends(get_db),
    membership: CompanyMembership = Depends(
        require_company_membership(
            "owner",
            "recruiter",
            "hiring_manager",
        )
    ),
):
    """Return applications for jobs belonging to an authorized company."""

    rows = (
        db.query(JobApplication, Job, User)
        .join(Job, Job.id == JobApplication.job_id)
        .join(User, User.id == JobApplication.user_id)
        .filter(Job.company_id == company_id)
        .order_by(JobApplication.created_at.desc())
        .all()
    )

    return [
        CompanyApplicationResponse(
            id=application.id,
            job_id=application.job_id,
            user_id=application.user_id,
            status=application.status,
            cover_letter=application.cover_letter,
            created_at=application.created_at,
            updated_at=application.updated_at,
            candidate_email=candidate.email,
            job_title=job.title,
        )
        for application, job, candidate in rows
    ]


@router.patch(
    "/companies/{company_id}/applications/{application_id}/status",
    dependencies=[Depends(require_csrf)],
)
def update_application_status(
    company_id: UUID,
    application_id: UUID,
    request: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    membership: CompanyMembership = Depends(
        require_company_membership(
            "owner",
            "recruiter",
            "hiring_manager",
        )
    ),
):
    """Update application status and create transactional notifications."""

    application = (
        db.query(JobApplication)
        .join(Job, Job.id == JobApplication.job_id)
        .filter(
            JobApplication.id == application_id,
            Job.company_id == company_id,
        )
        .with_for_update(of=JobApplication)
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    validate_application_transition(
        current_status=application.status,
        new_status=request.status,
    )

    old_status = application.status
    new_status = request.status

    try:
        # Get candidate email without relying on an ORM relationship.
        candidate = db.get(User, application.user_id)

        application.status = new_status

        notification_message = (
            f"Your application status changed from "
            f"{old_status} to {new_status}."
        )

        # 1. Create in-app notification.
        create_notification(
            db,
            user_id=application.user_id,
            notification_type="application_status_changed",
            title="Application status updated",
            message=notification_message,
        )

        # 2. Record application status history.
        record_application_status_change(
            db,
            application_id=application.id,
            changed_by_user_id=current_user.id,
            old_status=old_status,
            new_status=new_status,
        )

        # 3. Create email event in the SAME transaction.
        if candidate and candidate.email:
            enqueue_outbox_event(
                db,
                event_type="email.application_status_changed",
                payload={
                    "recipient": candidate.email,
                    "title": "Your application status has changed",
                    "message": (
                        f"Your application status is now {new_status}."
                    ),
                    "application_id": str(application.id),
                    "old_status": old_status,
                    "new_status": new_status,
                },
            )
        else:
            logger.warning(
                "No candidate email available for application %s",
                application.id,
            )

        # 4. Commit everything together.
        db.commit()
        db.refresh(application)

    except Exception:
        db.rollback()
        logger.exception(
            "Failed to update application status: %s",
            application_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update application status",
        )

    return {
        "message": "Application status updated successfully",
        "application_id": str(application.id),
        "job_id": str(application.job_id),
        "old_status": old_status,
        "status": application.status,
    }


@router.post(
    "/applications/{application_id}/withdraw",
    dependencies=[Depends(require_csrf)],
)
def withdraw_application(
    application_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allow a candidate to withdraw their own application."""

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can withdraw applications",
        )

    application = (
        db.query(JobApplication)
        .filter(
            JobApplication.id == application_id,
            JobApplication.user_id == current_user.id,
        )
        .with_for_update()
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    validate_application_transition(
        current_status=application.status,
        new_status="withdrawn",
    )

    job = db.get(Job, application.job_id)

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated job not found",
        )

    old_status = application.status
    new_status = "withdrawn"

    try:
        application.status = new_status

        # Find active company members who should be notified.
        recruiters = (
            db.query(User)
            .join(
                CompanyMembership,
                CompanyMembership.user_id == User.id,
            )
            .filter(
                CompanyMembership.company_id == job.company_id,
                CompanyMembership.status == "active",
                CompanyMembership.membership_role.in_(
                    ["owner", "recruiter", "hiring_manager"]
                ),
            )
            .all()
        )

        notification_title = "Candidate withdrew an application"
        notification_message = (
            f"{current_user.email} withdrew their application "
            f"for the job '{job.title}'."
        )

        for recruiter in recruiters:
            # In-app notification.
            create_notification(
                db,
                user_id=recruiter.id,
                notification_type="application_withdrawn",
                title=notification_title,
                message=notification_message,
            )

            # Transactional email event.
            if recruiter.email:
                enqueue_outbox_event(
                    db,
                    event_type="email.application_withdrawn",
                    payload={
                        "recipient": recruiter.email,
                        "title": notification_title,
                        "message": notification_message,
                        "application_id": str(application.id),
                        "job_id": str(job.id),
                        "candidate_id": str(current_user.id),
                    },
                )

        # Record status history in the same transaction.
        record_application_status_change(
            db,
            application_id=application.id,
            changed_by_user_id=current_user.id,
            old_status=old_status,
            new_status=new_status,
        )

        # Commit status, history, notifications and outbox events together.
        db.commit()
        db.refresh(application)

    except Exception:
        db.rollback()
        logger.exception(
            "Failed to withdraw application %s",
            application_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to withdraw application",
        )

    return {
        "message": "Application withdrawn successfully",
        "application_id": str(application.id),
        "job_id": str(application.job_id),
        "old_status": old_status,
        "status": application.status,
        "recruiters_notified": len(recruiters),
    }


@router.get(
    "/applications/{application_id}/history",
    response_model=list[ApplicationStatusHistoryResponse],
)
def get_application_history(
    application_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id)
        .first()
    )

    # Return the same response for missing and unauthorized applications.
    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    if current_user.role == "candidate":
        if application.user_id != current_user.id:
            raise HTTPException(
                status_code=404,
                detail="Application not found",
            )

    elif current_user.role in {"recruiter", "admin"}:
        company_id = (
            db.query(Job.company_id)
            .filter(Job.id == application.job_id)
            .scalar()
        )

        if current_user.role == "admin":
            # Platform admins can view all application histories.
            pass
        else:
            membership = (
                db.query(CompanyMembership)
                .filter(
                    CompanyMembership.company_id == company_id,
                    CompanyMembership.user_id == current_user.id,
                    CompanyMembership.status == "active",
                    CompanyMembership.membership_role.in_(
                        ["owner", "recruiter", "hiring_manager"]
                    ),
                )
                .first()
            )

            if membership is None:
                raise HTTPException(
                    status_code=404,
                    detail="Application not found",
                )
    else:
        raise HTTPException(
            status_code=403,
            detail="You cannot view application history",
        )

    return (
        db.query(ApplicationStatusHistory)
        .filter(
            ApplicationStatusHistory.application_id == application.id
        )
        .order_by(ApplicationStatusHistory.created_at.asc())
        .all()
    )
