from pathlib import Path

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends
)

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
from app.models.user import User

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
    current_user: User = Depends(get_current_user),
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

    

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:

        content = await file.read()

        file_size = len(content)

        validate_file(
            file.filename,
            file_size
        )

        filename = generate_filename(
            file.filename
        )

        file_path = UPLOAD_DIR / filename

        with open(file_path, "wb") as buffer:
            buffer.write(content)

        extension = get_file_extension(
            file.filename
        )

        resume_text = extract_resume_text(
            str(file_path),
            extension
        )

        resume = Resume(
            user_id=current_user.id,
            original_filename=file.filename,
            stored_filename=filename,
            file_path=str(file_path),
            raw_text=resume_text
        )

        db.add(resume)
        db.commit()
        db.refresh(resume)

        if not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from resume"
            )

        return {
            "message": "Resume uploaded successfully",
            "resume_id": str(resume.id),
            "filename": resume.original_filename,
            "text_length": len(resume.raw_text)
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )