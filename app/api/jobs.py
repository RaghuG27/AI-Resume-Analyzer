from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.job import Job
from app.schemas.job import JobCreate

from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"]
)

@router.get("/")
def get_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    jobs = (
        db.query(Job)
        .filter(
            Job.user_id == current_user.id
        )
        .order_by(Job.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(job.id),
            "title": job.title,
            "description": job.description,
        }
        for job in jobs
    ]

@router.post("/")
def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    job = Job(
        user_id=current_user.id,
        title=job_data.title,
        description=job_data.description
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return {
        "id": str(job.id),
        "title": job.title,
        "description": job.description
    }