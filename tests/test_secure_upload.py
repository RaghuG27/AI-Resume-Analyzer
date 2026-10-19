import pytest
from fastapi import HTTPException, UploadFile
from io import BytesIO

from app.utils.secure_upload import save_resume_upload


@pytest.mark.asyncio
async def test_rejects_unsupported_extension():
    upload = UploadFile(
        filename="resume.exe",
        file=BytesIO(b"not a resume"),
    )

    with pytest.raises(HTTPException) as exc:
        await save_resume_upload(upload)

    assert exc.value.status_code == 415


@pytest.mark.asyncio
async def test_rejects_empty_pdf():
    upload = UploadFile(
        filename="resume.pdf",
        file=BytesIO(b""),
    )

    with pytest.raises(HTTPException) as exc:
        await save_resume_upload(upload)

    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_rejects_fake_pdf():
    upload = UploadFile(
        filename="resume.pdf",
        file=BytesIO(b"This is not a PDF"),
    )

    with pytest.raises(HTTPException) as exc:
        await save_resume_upload(upload)

    assert exc.value.status_code == 415