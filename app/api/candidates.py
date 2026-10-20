from uuid import UUID

from typing import Literal

from sqlalchemy import String, cast, or_

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi_limiter.depends import RateLimiter

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Candidate, Resume
from app.schemas.candidate import (
    CandidateCreate,
    CandidateRead,
    CandidateUpdate,
)
from app.schemas.candidate_extraction import CandidateProfileExtraction
from app.services.candidate_extractor import extract_candidate_profile
from app.core.csrf import require_csrf

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])


def validate_resume_ownership(
    resume_id: UUID | None,
    user_id: UUID,
    db: Session,
) -> None:
    """Ensure the linked resume belongs to the authenticated recruiter."""
    if resume_id is None:
        return

    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == user_id,
        )
        .first()
    )

    if resume is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )


@router.post(
    "/",
    response_model=CandidateRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[
        Depends(RateLimiter(times=5, seconds=60)),
        Depends(require_csrf),
    ],
    
)
def create_candidate(
    payload: CandidateCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_resume_ownership(
        payload.source_resume_id,
        current_user.id,
        db,
    )

    candidate = Candidate(
        **payload.model_dump(),
        user_id=current_user.id,
    )

    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    return candidate


@router.get("/", response_model=list[CandidateRead])
def list_candidates(
    search: str | None = Query(default=None, min_length=1, max_length=100),
    skills: list[str] = Query(default=[]),
    min_experience: float | None = Query(default=None, ge=0),
    max_experience: float | None = Query(default=None, ge=0),
    sort_by: Literal["newest", "oldest"] = "newest",
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Always restrict results to the authenticated recruiter.
    query = db.query(Candidate).filter(
        Candidate.user_id == current_user.id
    )

    # Search by name, email, or current job title.
    if search:
        term = search.strip()

        if term:
            pattern = f"%{term}%"
            query = query.filter(
                or_(
                    Candidate.full_name.ilike(pattern),
                    Candidate.email.ilike(pattern),
                    Candidate.current_title.ilike(pattern),
                )
            )

    # Filter candidates by skills.
    # Cast JSON to text for compatibility with the existing JSON column.
    for skill in skills:
        skill = skill.strip()

        if skill:
            query = query.filter(
                cast(Candidate.skills, String).ilike(
                    f'%"{skill}"%'
                )
            )

    # Filter by experience.
    if min_experience is not None:
        query = query.filter(
            Candidate.experience_years >= min_experience
        )

    if max_experience is not None:
        query = query.filter(
            Candidate.experience_years <= max_experience
        )

    # Sort results.
    if sort_by == "oldest":
        query = query.order_by(Candidate.created_at.asc())
    else:
        query = query.order_by(Candidate.created_at.desc())

    # Pagination.
    return query.offset(skip).limit(limit).all()


@router.get("/{candidate_id}", response_model=CandidateRead)
def get_candidate(
    candidate_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    candidate = (
        db.query(Candidate)
        .filter(
            Candidate.id == candidate_id,
            Candidate.user_id == current_user.id,
        )
        .first()
    )

    if candidate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    return candidate


@router.patch("/{candidate_id}", response_model=CandidateRead, dependencies=[Depends(require_csrf)])
def update_candidate(
    candidate_id: UUID,
    payload: CandidateUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    candidate = (
        db.query(Candidate)
        .filter(
            Candidate.id == candidate_id,
            Candidate.user_id == current_user.id,
        )
        .first()
    )

    if candidate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    changes = payload.model_dump(exclude_unset=True)

    if "full_name" in changes and changes["full_name"] is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Full name cannot be null",
        )

    if "skills" in changes and changes["skills"] is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Skills cannot be null",
        )

    if "source_resume_id" in changes:
        validate_resume_ownership(
            changes["source_resume_id"],
            current_user.id,
            db,
        )

    for field, value in changes.items():
        setattr(candidate, field, value)

    db.commit()
    db.refresh(candidate)

    return candidate


@router.delete(
    "/{candidate_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_csrf)]
)
def delete_candidate(
    candidate_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    candidate = (
        db.query(Candidate)
        .filter(
            Candidate.id == candidate_id,
            Candidate.user_id == current_user.id,
        )
        .first()
    )

    if candidate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    db.delete(candidate)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/from-resume/{resume_id}",
    response_model=CandidateRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_csrf)]
)
def create_candidate_from_resume(
    resume_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Verify resume ownership before sending its content to Gemini.
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
            detail="Resume has no extracted text. Upload or parse it first.",
        )

    try:
        profile = extract_candidate_profile(resume.raw_text)
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="Could not extract a valid candidate profile",
        )
    except Exception:
        # Log the exception on the server in production.
        raise HTTPException(
            status_code=502,
            detail="Candidate profile extraction failed",
        )

    # Reuse an existing candidate linked to this resume instead of
    # creating duplicate profiles on repeated extraction requests.
    candidate = (
        db.query(Candidate)
        .filter(
            Candidate.user_id == current_user.id,
            Candidate.source_resume_id == resume.id,
        )
        .first()
    )

    extracted = profile.model_dump()

    try:
        if candidate is None:
            candidate = Candidate(
                **extracted,
                user_id=current_user.id,
                source_resume_id=resume.id,
            )
            db.add(candidate)
        else:
            # Avoid erasing previously captured details when Gemini
            # cannot extract an optional field.
            for field, value in extracted.items():
                if value is not None and value != []:
                    setattr(candidate, field, value)

        db.commit()
        db.refresh(candidate)
        return candidate

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save the candidate profile",
        )