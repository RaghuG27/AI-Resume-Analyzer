from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.models.analysis import Analysis


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume_count = (
        db.query(func.count(Resume.id))
        .filter(
            Resume.user_id == current_user.id
        )
        .scalar()
        or 0
    )

    job_count = (
        db.query(func.count(Job.id))
        .filter(
            Job.user_id == current_user.id
        )
        .scalar()
        or 0
    )

    analysis_count = (
        db.query(func.count(Analysis.id))
        .join(
            Resume,
            Analysis.resume_id == Resume.id,
        )
        .join(
            Job,
            Analysis.job_id == Job.id,
        )
        .filter(
            Resume.user_id == current_user.id,
            Job.user_id == current_user.id,
        )
        .scalar()
        or 0
    )

    average_score = (
        db.query(func.avg(Analysis.overall_score))
        .join(
            Resume,
            Analysis.resume_id == Resume.id,
        )
        .join(
            Job,
            Analysis.job_id == Job.id,
        )
        .filter(
            Resume.user_id == current_user.id,
            Job.user_id == current_user.id,
        )
        .scalar()
    )

    recent_analyses = (
        db.query(Analysis, Resume, Job)
        .join(
            Resume,
            Analysis.resume_id == Resume.id,
        )
        .join(
            Job,
            Analysis.job_id == Job.id,
        )
        .filter(
            Resume.user_id == current_user.id,
            Job.user_id == current_user.id,
        )
        .order_by(
            Analysis.created_at.desc()
        )
        .limit(5)
        .all()
    )

    return {
        "resume_count": resume_count,
        "job_count": job_count,
        "analysis_count": analysis_count,
        "average_score": (
            round(float(average_score), 1)
            if average_score is not None
            else 0
        ),
        "recent_analyses": [
            {
                "id": str(analysis.id),
                "resume_id": str(resume.id),
                "job_id": str(job.id),
                "resume_filename": resume.original_filename,
                "job_title": job.title,
                "overall_score": analysis.overall_score,
                "ats_score": analysis.ats_score,
                "job_match_score": analysis.job_match_score,
                "created_at": analysis.created_at,
            }
            for analysis, resume, job in recent_analyses
        ],
    }