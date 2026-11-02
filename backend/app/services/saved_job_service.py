
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.job import Job
from app.models.saved_job import SavedJob


def save_job(
    db: Session,
    *,
    user_id: UUID,
    job_id: UUID,
) -> SavedJob:
    """Add a job to a candidate's saved jobs."""

    saved_job = SavedJob(
        user_id=user_id,
        job_id=job_id,
    )

    db.add(saved_job)
    return saved_job


def get_saved_job(
    db: Session,
    *,
    user_id: UUID,
    job_id: UUID,
) -> SavedJob | None:
    """Find a saved job belonging to a specific user."""

    return db.execute(
        select(SavedJob).where(
            SavedJob.user_id == user_id,
            SavedJob.job_id == job_id,
        )
    ).scalar_one_or_none()


def remove_saved_job(
    db: Session,
    *,
    user_id: UUID,
    job_id: UUID,
) -> bool:
    """Remove a user's bookmark."""

    saved_job = get_saved_job(
        db,
        user_id=user_id,
        job_id=job_id,
    )

    if saved_job is None:
        return False

    db.delete(saved_job)
    return True


def list_saved_jobs(
    db: Session,
    *,
    user_id: UUID,
    offset: int,
    limit: int,
) -> tuple[list[SavedJob], int]:
    """Return a user's saved jobs and total count."""

    total = db.scalar(
        select(func.count())
        .select_from(SavedJob)
        .where(SavedJob.user_id == user_id)
    ) or 0

    saved_jobs = db.execute(
        select(SavedJob)
        .join(Job, SavedJob.job_id == Job.id)
        .where(SavedJob.user_id == user_id)
        .order_by(
            SavedJob.created_at.desc(),
            SavedJob.id.desc(),
        )
        .offset(offset)
        .limit(limit)
    ).scalars().all()

    return saved_jobs, total
