from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.models.job import Job
from app.models.analysis import Analysis
from app.models.user import User

from app.services.gemini_service import analyze_resume

from app.services.score_engine import (
   calculate_all_scores,
)

def run_resume_analysis(
    resume_id: UUID,
    job_id: UUID,
    current_user: User,
    db: Session
):
    # 1. Get user's resume
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    print(f"Resume: {resume}")

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    # 2. Get user's job description

    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()

    print(f"Job: {job}")

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job description not found"
        )

    # 3. Send resume + JD to Gemini
    result = analyze_resume(
        resume_text=resume.raw_text,
        job_description=job.description
    )

    print(f"Result: {result}")

    # 4. Calculate deterministic scores
    scores = calculate_all_scores(
        result.requirements
    )

    
    # 5. Store detailed Gemini analysis + calculated scores

    detailed_result = {
        "requirements": [
            requirement.model_dump()
            for requirement in result.requirements
        ],

        "strengths": result.strengths,

        "weaknesses": result.weaknesses,

        "recommendations": result.recommendations,

        "summary": result.summary,

        "scores": {
            "skill_score": scores["skill_score"],
            "experience_score": scores["experience_score"],
            "responsibility_score": (
                scores["responsibility_score"]
            ),
            "ats_score": scores["ats_score"],
            "education_score": scores["education_score"],
            "overall_score": scores["overall_score"],
        },
    }

  
    # 6. Save analysis in database
    

    analysis = Analysis(
        resume_id=resume.id,
        job_id=job.id,

        overall_score=scores["overall_score"],

        ats_score=scores["ats_score"],

        job_match_score=round(
            (
                scores["skill_score"] * 0.50
                + scores["experience_score"] * 0.30
                + scores["responsibility_score"] * 0.20
            )
        ),

        result=detailed_result,
    )


    db.add(analysis)

    db.commit()

    db.refresh(analysis)

    return analysis