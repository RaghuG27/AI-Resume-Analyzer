from math import isfinite

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.csrf import require_csrf
from app.core.company_permissions import require_company_membership

from app.models.job import Job
from app.models.user import User
from app.models.company_membership import CompanyMembership
from app.models.resume import Resume
from app.models.company import Company

from app.services.job_match_service import calculate_job_match
from app.services.semantic_match_service import (
    SemanticMatchingError,
    calculate_semantic_similarities,
)

from app.services.job_recommendation_service import (
    calculate_recommendation_score,
)

from app.services.experience_match_service import (
    extract_minimum_experience,
    extract_seniority,
)

from app.schemas.job import (
    JobCreateRequest,
    JobUpdateRequest,
    CompanyJobResponse,
)


router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"],
)



def validate_semantic_scores(scores, expected_count):
    """Validate semantic matching output."""

    if len(scores) != expected_count:
        raise SemanticMatchingError(
            "Unexpected number of semantic scores"
        )

    validated = []

    for score in scores:
        if isinstance(score, bool) or not isinstance(
            score, (int, float)
        ):
            raise SemanticMatchingError(
                "Semantic score must be numeric"
            )

        if not isfinite(score) or not 0 <= score <= 100:
            raise SemanticMatchingError(
                "Semantic score must be between 0 and 100"
            )

        validated.append(float(score))

    return validated



@router.get("/")
def get_jobs(
    db: Session = Depends(get_db),
):
    """List published jobs for the candidate marketplace."""

    rows = (
        db.query(Job, Company.name.label("company_name"))
        .outerjoin(Company, Company.id == Job.company_id)
        .filter(Job.status == "published")
        .order_by(Job.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(job.id),
            "company_id": (
                str(job.company_id)
                if job.company_id else None
            ),
            "company_name": company_name or "Independent employer",
            "title": job.title,
            "description": job.description,
            "location": job.location,
            "employment_type": job.employment_type,
            "status": job.status,
            "created_at": job.created_at,
        }
        for job, company_name in rows
    ]



@router.get("/companies/{company_id}/manage")
def list_company_jobs(
    company_id: UUID,
    db: Session = Depends(get_db),
    membership: CompanyMembership = Depends(
        require_company_membership("owner", "recruiter", "hiring_manager")
    ),
):
    """List all company jobs for an active company member."""
    jobs = (
        db.query(Job)
        .filter(Job.company_id == company_id)
        .order_by(Job.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(job.id),
            "company_id": str(job.company_id),
            "created_by_user_id": str(job.created_by_user_id) if job.created_by_user_id else None,
            "title": job.title,
            "description": job.description,
            "location": job.location,
            "employment_type": job.employment_type,
            "status": job.status,
            "created_at": job.created_at,
            "updated_at": job.updated_at,
        }
        for job in jobs
    ]


@router.get("/{job_id}/match")
def get_job_match(
    job_id: UUID,
    resume_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Calculate the complete match score for one job."""

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can calculate job matches",
        )

    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    if not resume.raw_text or not resume.raw_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Resume has no extracted text",
        )

    job = (
        db.query(Job)
        .filter(
            Job.id == job_id,
            Job.status == "published",
        )
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Published job not found",
        )

    candidate_experience = extract_minimum_experience(
        resume.raw_text
    )

    candidate_seniority = extract_seniority(
        resume.raw_text
    )

    semantic_score = None

    try:
        if job.description and job.description.strip():
            scores = calculate_semantic_similarities(
                resume_text=resume.raw_text,
                job_descriptions=[job.description],
            )

            scores = validate_semantic_scores(scores, 1)
            semantic_score = scores[0]

    except (SemanticMatchingError, ValueError):
        semantic_score = None

    result = calculate_recommendation_score(
        resume_text=resume.raw_text,
        job_description=job.description or "",
        semantic_score=semantic_score,
        candidate_experience=candidate_experience,
        candidate_seniority=candidate_seniority,
    )

    return {
        "job_id": str(job.id),
        "job_title": job.title,
        "resume_id": str(resume.id),
        "semantic_matching_available": (
            semantic_score is not None
        ),
        **result,
    }


@router.get("/matches")
def match_resume_against_jobs(
    resume_id: UUID,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Recommend published jobs using four matching factors."""

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can calculate job matches",
        )

    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    if not resume.raw_text or not resume.raw_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Resume has no extracted text",
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=422,
            detail="Limit must be between 1 and 100",
        )

    jobs = (
        db.query(
            Job,
            Company.name.label("company_name"),
        )
        .join(
            Company,
            Company.id == Job.company_id,
        )
        .filter(Job.status == "published")
        .order_by(Job.created_at.desc())
        .all()
    )

    if not jobs:
        return {
            "resume_id": str(resume.id),
            "total_jobs_matched": 0,
            "semantic_matching_available": False,
            "results": [],
        }

    candidate_experience = extract_minimum_experience(
        resume.raw_text
    )

    candidate_seniority = extract_seniority(
        resume.raw_text
    )

    semantic_scores = [None] * len(jobs)
    semantic_matching_available = False

    # Only send non-empty job descriptions to the semantic model.
    valid_indices = [
        index
        for index, (job, _) in enumerate(jobs)
        if job.description and job.description.strip()
    ]

    if valid_indices:
        try:
            descriptions = [
                jobs[index][0].description
                for index in valid_indices
            ]

            scores = calculate_semantic_similarities(
                resume_text=resume.raw_text,
                job_descriptions=descriptions,
            )

            scores = validate_semantic_scores(
                scores,
                len(valid_indices),
            )

            for index, score in zip(valid_indices, scores):
                semantic_scores[index] = score

            semantic_matching_available = True

        except (SemanticMatchingError, ValueError):
            semantic_scores = [None] * len(jobs)

    matches = []

    for index, (job, company_name) in enumerate(jobs):

        result = calculate_recommendation_score(
            resume_text=resume.raw_text,
            job_description=job.description or "",
            semantic_score=semantic_scores[index],
            candidate_experience=candidate_experience,
            candidate_seniority=candidate_seniority,
        )

        matches.append({
            "job_id": str(job.id),
            "company_id": str(job.company_id),
            "company_name": company_name,
            "title": job.title,
            "description": job.description,
            "location": job.location,
            "employment_type": job.employment_type,
            **result,
            "_created_at": job.created_at,
        })

    matches.sort(
        key=lambda item: (
            item["match_score"],
            item["_created_at"],
        ),
        reverse=True,
    )

    for match in matches:
        match.pop("_created_at", None)

    return {
        "resume_id": str(resume.id),
        "total_jobs_matched": len(matches),
        "semantic_matching_available": semantic_matching_available,
        "results": matches[:limit],
    }


@router.post(
    "/companies/{company_id}",
    response_model=CompanyJobResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_csrf)],
)
def create_job(
    company_id: UUID,
    job_data: JobCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    membership: CompanyMembership = Depends(
        require_company_membership("owner", "recruiter")
    ),
):
    """Create a draft job for a company the user belongs to."""

    title = job_data.title.strip()
    description = job_data.description.strip()

    if not title or not description:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Title and description cannot be empty",
        )

    job = Job(
        company_id=company_id,
        created_by_user_id=current_user.id,
        title=title,
        description=description,
        location=(
            job_data.location.strip()
            if job_data.location
            else None
        ),
        employment_type=(
            job_data.employment_type.strip()
            if job_data.employment_type
            else None
        ),
        status="draft",
    )

    try:
        db.add(job)
        db.commit()
        db.refresh(job)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create job",
        )

    return job


@router.patch(
    "/companies/{company_id}/{job_id}/publish",
    dependencies=[Depends(require_csrf)],
)
def publish_job(
    company_id: UUID,
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    membership: CompanyMembership = Depends(
        require_company_membership("owner", "recruiter")
    ),
):
    """Publish a draft job."""

    job = (
        db.query(Job)
        .filter(
            Job.id == job_id,
            Job.company_id == company_id,
        )
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    if job.status != "draft":
        raise HTTPException(
            status_code=409,
            detail="Only draft jobs can be published",
        )

    job.status = "published"

    try:
        db.commit()
        db.refresh(job)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to publish job",
        )

    return {
        "message": "Job published successfully",
        "job_id": str(job.id),
        "company_id": str(job.company_id),
        "status": job.status,
    }


@router.patch(
    "/companies/{company_id}/{job_id}",
    dependencies=[Depends(require_csrf)],
)
def update_job(
    company_id: UUID,
    job_id: UUID,
    job_data: JobUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    membership: CompanyMembership = Depends(
        require_company_membership("owner", "recruiter")
    ),
):
    """Update a draft job."""

    job = (
        db.query(Job)
        .filter(
            Job.id == job_id,
            Job.company_id == company_id,
        )
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    if job.status != "draft":
        raise HTTPException(
            status_code=409,
            detail="Only draft jobs can be edited",
        )

    updates = job_data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=422,
            detail="Provide at least one field to update",
        )

    for field, value in updates.items():
        if field in {"location", "employment_type"} and value is None:
            setattr(job, field, None)
            continue

        if isinstance(value, str):
            value = value.strip()

            if not value:
                raise HTTPException(
                    status_code=422,
                    detail=f"{field} cannot be empty",
                )

        setattr(job, field, value)

    try:
        db.commit()
        db.refresh(job)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to update job",
        )

    return {
        "message": "Job updated successfully",
        "job_id": str(job.id),
        "company_id": str(job.company_id),
        "status": job.status,
    }


@router.patch(
    "/companies/{company_id}/{job_id}/close",
    dependencies=[Depends(require_csrf)],
)
def close_job(
    company_id: UUID,
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    membership: CompanyMembership = Depends(
        require_company_membership("owner", "recruiter")
    ),
):
    """Close a published job."""

    job = (
        db.query(Job)
        .filter(
            Job.id == job_id,
            Job.company_id == company_id,
        )
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    if job.status != "published":
        raise HTTPException(
            status_code=409,
            detail="Only published jobs can be closed",
        )

    job.status = "closed"

    try:
        db.commit()
        db.refresh(job)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to close job",
        )

    return {
        "message": "Job closed successfully",
        "job_id": str(job.id),
        "company_id": str(job.company_id),
        "status": job.status,
    }



@router.get("/companies/mine")
def get_my_company_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can access company job management",
        )

    rows = (
        db.query(Job, Company.name.label("company_name"))
        .join(Company, Company.id == Job.company_id)
        .join(
            CompanyMembership,
            CompanyMembership.company_id == Company.id,
        )
        .filter(
            CompanyMembership.user_id == current_user.id,
            CompanyMembership.status == "active",
            CompanyMembership.membership_role.in_(
                ["owner", "recruiter"]
            ),
        )
        .order_by(Job.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(job.id),
            "company_id": str(job.company_id),
            "company_name": company_name,
            "title": job.title,
            "description": job.description,
            "location": job.location,
            "employment_type": job.employment_type,
            "status": job.status,
            "created_at": job.created_at,
            "updated_at": job.updated_at,
        }
        for job, company_name in rows
    ]
