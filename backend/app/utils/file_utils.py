from pathlib import Path
from uuid import uuid4


ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx"
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def get_file_extension(filename: str) -> str:

    return Path(filename).suffix.lower()


def validate_file(
    filename: str,
    file_size: int
):

    extension = get_file_extension(filename)

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(
            "Only PDF and DOCX files are supported"
        )

    if file_size > MAX_FILE_SIZE:
        raise ValueError(
            "File size must not exceed 10 MB"
        )


def generate_filename(
    original_filename: str
) -> str:

    extension = get_file_extension(
        original_filename
    )

    return f"{uuid4()}{extension}"