from uuid import UUID

from app.worker.celery_app import celery_app

from app.core.database import SessionLocal

from app.models.resume import Resume
from app.models.job import Job
from app.models.analysis import Analysis
from app.models.analysis_job import AnalysisJob

from app.services.gemini_service import analyze_resume

from app.services.score_engine import calculate_all_scores


@celery_app.task(
    bind=True,
    max_retries=3,
    track_started=True,
    soft_time_limit=120,
    time_limit=150,
    )
def analyze_resume_task(
    self,
    analysis_job_id: str,
    resume_id: str,
    job_id: str,
    force_failure: bool = False,
):

    db = SessionLocal()

    try:

        # --------------------------------------------
        # 1. Get AnalysisJob
        # --------------------------------------------

        analysis_job = db.get(
            AnalysisJob,
            UUID(analysis_job_id),
        )

        if not analysis_job:
            raise ValueError(
                "Analysis job not found"
            )

        if force_failure:
            raise Exception("Intentional test failure")

        # --------------------------------------------
        # 2. Mark as STARTED
        # --------------------------------------------

        analysis_job.status = "STARTED"
        analysis_job.error_message = None

        db.commit()


        # --------------------------------------------
        # 1. Get resume
        # --------------------------------------------

        resume = db.get(
            Resume,
            UUID(resume_id),
        )

        if not resume:
            raise ValueError(
                "Resume not found"
            )

        # --------------------------------------------
        # 2. Get job
        # --------------------------------------------

        job = db.get(
            Job,
            UUID(job_id),
        )

        if not job:
            raise ValueError(
                "Job description not found"
            )

        # --------------------------------------------
        # 3. Gemini analysis
        # --------------------------------------------

        result = analyze_resume(
            resume_text=resume.raw_text,
            job_description=job.description,
        )

        # --------------------------------------------
        # 4. Calculate scores
        # --------------------------------------------

        scores = calculate_all_scores(
            result.requirements
        )

        # --------------------------------------------
        # 5. Job match score
        # --------------------------------------------

        job_match_score = round(
            scores["skill_score"] * 0.50
            + scores["experience_score"] * 0.30
            + scores["responsibility_score"] * 0.20
        )

        # --------------------------------------------
        # 6. Detailed result
        # --------------------------------------------

        detailed_result = {
            "requirements": [
                requirement.model_dump()
                for requirement in result.requirements
            ],

            "strengths": result.strengths,

            "weaknesses": result.weaknesses,

            "recommendations": result.recommendations,

            "summary": result.summary,

            "scores": scores,
        }

        # --------------------------------------------
        # 7. Save analysis
        # --------------------------------------------

        analysis = Analysis(
            resume_id=resume.id,
            job_id=job.id,
            overall_score=scores["overall_score"],
            ats_score=scores["ats_score"],
            job_match_score=job_match_score,
            result=detailed_result,
        )

        db.add(analysis)

        db.flush()

        analysis_job.status = "SUCCESS"
        analysis_job.error_message = None

        db.commit()

        db.refresh(analysis)

        return {
            "analysis_id": str(analysis.id),
            "overall_score": analysis.overall_score,
        }

    except Exception as exc:

        db.rollback()

        # Try to mark task as failed
        try:

            analysis_job = db.get(
                AnalysisJob,
                UUID(analysis_job_id),
            )

            if analysis_job:

                if self.request.retries < self.max_retries:

                    analysis_job.status = "RETRY"

                    analysis_job.error_message = (
                        str(exc)
                    )

                else:

                    analysis_job.status = "FAILURE"

                    analysis_job.error_message = (
                        str(exc)
                    )

                db.commit()

        except Exception:

            db.rollback()
        
        # -----------------------------------------
        # Retry
        # -----------------------------------------

        if self.request.retries < self.max_retries:

            raise self.retry(
                exc=exc,
                countdown=2 ** self.request.retries,
            )

        raise

    finally:

        db.close()