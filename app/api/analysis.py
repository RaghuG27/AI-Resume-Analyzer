from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session



from app.core.database import get_db
from app.core.security import get_current_user

from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.models.analysis_job import AnalysisJob

from app.schemas.analysis import AnalysisRequest

from app.worker.tasks import analyze_resume_task


from celery.result import AsyncResult

from app.worker.celery_app import celery_app

from app.models.analysis import Analysis

from app.services.learning_service import (
    generate_learning_plan,
)

from google.genai import errors as genai_errors

router = APIRouter(
    prefix="/api/analysis",
    tags=["Analysis"],
)



@router.get("/")
def get_analysis_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analyses = (
        db.query(Analysis, Resume, Job)
        .join(Resume, Analysis.resume_id == Resume.id)
        .join(Job, Analysis.job_id == Job.id)
        .filter(
            Resume.user_id == current_user.id,
            Job.user_id == current_user.id,
        )
        .order_by(Analysis.created_at.desc())
        .all()
    )

    return [
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
        for analysis, resume, job in analyses
    ]
    

@router.post("/")
def create_analysis(
    request: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ---------------------------------------------
    # 1. Convert IDs
    # ---------------------------------------------

    try:
        resume_id = UUID(request.resume_id)
        job_id = UUID(request.job_id)

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid resume_id or job_id",
        )

    # ---------------------------------------------
    # 2. Verify resume ownership
    # ---------------------------------------------

    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
    ).first()

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    # ---------------------------------------------
    # 3. Verify job ownership
    # ---------------------------------------------

    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id,
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job description not found",
        )


    
    # ---------------------------------------------
    # 4. Check for existing active analysis
    # ---------------------------------------------

    existing_job = db.query(
        AnalysisJob
    ).filter(
        AnalysisJob.user_id == current_user.id,
        AnalysisJob.resume_id == resume.id,
        AnalysisJob.job_id == job.id,
        AnalysisJob.status.in_([
            "PENDING",
            "STARTED",
            "RETRY",
        ]),
    ).first()

    if existing_job:

        return {
            "analysis_job_id": str(
                existing_job.id
            ),

            "task_id": existing_job.celery_task_id,

            "status": existing_job.status,

            "message": "Analysis already in progress",
        }


    # ---------------------------------------------
    # 4. Generate Celery task ID ourselves
    # ---------------------------------------------

    task_id = str(uuid4())


    # ---------------------------------------------
    # 5. Create AnalysisJob
    # ---------------------------------------------

    analysis_job = AnalysisJob(
        user_id=current_user.id,

        resume_id=resume.id,

        job_id=job.id,

        celery_task_id=task_id,

        status="PENDING",
    )

    db.add(analysis_job)

    # ---------------------------------------------
    # 7. Commit BEFORE sending Celery task
    # ---------------------------------------------

    try:

        db.commit()

        db.refresh(analysis_job)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to create analysis job",
        )


    # ---------------------------------------------
    # 8. Now send task to Celery
    # ---------------------------------------------

    try:

        analyze_resume_task.apply_async(
            args=[
                str(analysis_job.id),
                str(resume.id),
                str(job.id),
            ],
            task_id=task_id,
        )

    except Exception as exc:

        # -----------------------------------------
        # Redis/Celery submission failed
        # -----------------------------------------

        analysis_job.status = "FAILURE"

        analysis_job.error_message = (
            f"Failed to queue Celery task: {str(exc)}"
        )

        db.commit()

        raise HTTPException(
            status_code=503,
            detail="Failed to queue analysis task",
        )

    # ---------------------------------------------
    # 8. Return task information
    # ---------------------------------------------

    return {
        "analysis_job_id": str(
            analysis_job.id
        ),
        "task_id": task_id,
        "status": "PENDING",
        "message": "Resume analysis started",
    }


# To get status of background task.
@router.get("/status/{task_id}")
def get_analysis_status(
    task_id: str,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    # ---------------------------------------------
    # 1. Find AnalysisJob
    # ---------------------------------------------

    analysis_job = db.query(AnalysisJob).filter(
        AnalysisJob.celery_task_id == task_id,
        AnalysisJob.user_id == current_user.id,
    ).first()

    if not analysis_job:

        raise HTTPException(
            status_code=404,
            detail="Analysis task not found",
        )

    # ---------------------------------------------
    # 2. Ask Celery for task status
    # ---------------------------------------------

    task = AsyncResult(
        task_id,
        app=celery_app,
    )

    # ---------------------------------------------
    # 3. Build response
    # ---------------------------------------------

    response = {
        "analysis_job_id": str(
            analysis_job.id
        ),

        "task_id": task_id,

        "status": analysis_job.status,

        "celery_status": task.status,
    }

    # ---------------------------------------------
    # 4. Handle SUCCESS
    # ---------------------------------------------

    if analysis_job.status == "SUCCESS":

        if task.successful():

            response["result"] = task.result

    # ---------------------------------------------
    # 5. Handle FAILURE
    # ---------------------------------------------

    if analysis_job.status == "FAILURE":

        response["error"] = (
            analysis_job.error_message
        )

    return response

@router.get("/{analysis_id}")
def get_analysis(
    analysis_id: str,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):
    # ---------------------------------------------
    # 1. Convert ID
    # ---------------------------------------------

    try:
        analysis_uuid = UUID(analysis_id)

    except ValueError:

        raise HTTPException(
            status_code=400,
            detail="Invalid analysis_id",
        )

    # ---------------------------------------------
    # 2. Find analysis
    # ---------------------------------------------

    analysis = (
        db.query(Analysis)
        .join(
            Resume,
            Analysis.resume_id == Resume.id
        )
        .join(
            Job,
            Analysis.job_id == Job.id
        )
        .filter(
            Analysis.id == analysis_uuid,
            Resume.user_id == current_user.id,
            Job.user_id == current_user.id,
        )
        .first()
    )

    # ---------------------------------------------
    # 3. Check existence / ownership
    # ---------------------------------------------

    if not analysis:

        raise HTTPException(
            status_code=404,
            detail="Analysis not found",
        )

    # ---------------------------------------------
    # 4. Return analysis
    # ---------------------------------------------

    return {
        "id": str(analysis.id),

        "resume_id": str(
            analysis.resume_id
        ),

        "job_id": str(
            analysis.job_id
        ),

        "overall_score": analysis.overall_score,

        "ats_score": analysis.ats_score,

        "job_match_score": analysis.job_match_score,

        "result": analysis.result,

        "created_at": analysis.created_at,
    }

@router.get("/{analysis_id}/learning")
def get_learning_plan(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        analysis_uuid = UUID(analysis_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid analysis_id",
        )

    result = (
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
        Analysis.id == analysis_uuid,
        Resume.user_id == current_user.id,
        Job.user_id == current_user.id,
    )
    .first()
)

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found",
        )

    analysis, resume, job = result

    requirements = (
        analysis.result.get("requirements", [])
        if analysis.result
        else []
    )

    try:
        learning_plan = generate_learning_plan(
            resume_text=resume.raw_text,
            job_description=job.description,
            requirements=requirements,
        )
    except genai_errors.ClientError as exc:
        if exc.code == 429:
            raise HTTPException(
                status_code=429,
                detail=(
                    "The AI service is temporarily unavailable due to "
                    "rate limits. Please try again in a little while."
                ),
            )
        raise HTTPException(
            status_code=502,
            detail="The AI service rejected the request.",
        )
    except genai_errors.ServerError:
        raise HTTPException(
            status_code=502,
            detail="The AI service is temporarily unavailable.",
        )

    return learning_plan.model_dump()