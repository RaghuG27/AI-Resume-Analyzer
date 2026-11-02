from pathlib import Path
from uuid import UUID

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends
)
from fastapi_limiter.depends import RateLimiter
from fastapi.responses import FileResponse
from app.services.resume_parser import (
    extract_resume_text
)


from app.utils.file_utils import (
    validate_file,
    generate_filename,
    get_file_extension
)
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.resume import Resume

from app.core.security import get_current_user
from app.core.permissions import require_roles
from app.models.user import User
from app.core.csrf import require_csrf
from app.utils.secure_upload import save_resume_upload


router = APIRouter(
    prefix="/api/resumes",
    tags=["Resumes"]
)


UPLOAD_DIR = Path("uploads")

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)


@router.get("/")
def get_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("candidate", "recruiter")),
):
    resumes = (
        db.query(Resume)
        .filter(
            Resume.user_id == current_user.id
        )
        .order_by(Resume.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(resume.id),
            "original_filename": resume.original_filename,
            "created_at": resume.created_at,
        }
        for resume in resumes
    ]

    


@router.post(
    "/upload",
    dependencies=[
        Depends(RateLimiter(times=5, seconds=60)),
        Depends(require_csrf),
    ],
)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("candidate", "recruiter")),
):
    saved_path: Path | None = None

    try:
        original_filename, saved_file_path = await save_resume_upload(file)
        saved_path = Path(saved_file_path)

        extension = get_file_extension(original_filename)
        resume_text = extract_resume_text(
            str(saved_path),
            extension,
        )

        if not resume_text or not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from resume",
            )

    except HTTPException:
        if saved_path is not None:
            saved_path.unlink(missing_ok=True)
        raise

    except ValueError as error:
        if saved_path is not None:
            saved_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception:
        if saved_path is not None:
            saved_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail="Unable to process resume upload",
        )

    resume = Resume(
        user_id=current_user.id,
        original_filename=original_filename,
        stored_filename=saved_path.name,
        file_path=str(saved_path),
        raw_text=resume_text,
    )

    try:
        db.add(resume)
        db.commit()
        db.refresh(resume)

    except Exception:
        db.rollback()
        saved_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to save resume",
        )

    return {
        "message": "Resume uploaded successfully",
        "resume_id": str(resume.id),
        "filename": resume.original_filename,
        "text_length": len(resume.raw_text),
    }



@router.get("/{resume_id}/file")
def open_resume_file(
    resume_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("candidate", "recruiter")),
):
    """Serve an uploaded resume to its owner for in-browser viewing."""

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

    file_path = Path(resume.file_path).resolve()

    upload_root = (
        Path(__file__).resolve().parents[2] / "uploads"
    ).resolve()

    # Prevent access to files outside the uploads directory.
    if upload_root not in file_path.parents or not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Resume file not found",
        )

    extension = file_path.suffix.lower()

    media_types = {
        ".pdf": "application/pdf",
        ".docx": (
            "application/vnd.openxmlformats-officedocument."
            "wordprocessingml.document"
        ),
    }

    media_type = media_types.get(extension)

    if media_type is None:
        raise HTTPException(
            status_code=415,
            detail="Unsupported resume format",
        )

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=Path(resume.original_filename).name,
        content_disposition_type="inline",
        headers={
            "X-Content-Type-Options": "nosniff",
        },
    )
