
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.csrf import require_csrf
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.job import Job
from app.models.user import User
from app.schemas.saved_job import (
    SavedJobListResponse,
    SavedJobResponse,
)
from app.services.saved_job_service import (
    save_job,
    get_saved_job,
    remove_saved_job,
    list_saved_jobs,
)


router = APIRouter(
    prefix="/api/jobs",
    tags=["Saved Jobs"],
)


def require_candidate(current_user: User) -> None:
    role = getattr(current_user.role, "value", current_user.role)

    if role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can manage saved jobs",
        )


@router.post(
    "/{job_id}/save",
    response_model=SavedJobResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_csrf)],
)
def save_job_endpoint(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_candidate(current_user)

    job = db.query(Job).filter(Job.id == job_id).first()

    if job is None or job.status != "published":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Published job not found",
        )

    existing = get_saved_job(
        db,
        user_id=current_user.id,
        job_id=job_id,
    )

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Job is already saved",
        )

    saved_job = save_job(
        db,
        user_id=current_user.id,
        job_id=job_id,
    )

    try:
        db.commit()
        db.refresh(saved_job)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Job is already saved",
        )

    return saved_job


@router.delete(
    "/{job_id}/save",
    dependencies=[Depends(require_csrf)],
)
def remove_saved_job_endpoint(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_candidate(current_user)

    removed = remove_saved_job(
        db,
        user_id=current_user.id,
        job_id=job_id,
    )

    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved job not found",
        )

    db.commit()

    return {
        "message": "Job removed from saved jobs",
        "job_id": str(job_id),
    }


@router.get(
    "/saved/me",
    response_model=SavedJobListResponse,
)
def get_my_saved_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_candidate(current_user)

    saved_jobs, total = list_saved_jobs(
        db,
        user_id=current_user.id,
        offset=(page - 1) * page_size,
        limit=page_size,
    )

    return SavedJobListResponse(
        items=saved_jobs,
        total=total,
        page=page,
        page_size=page_size,
    )
