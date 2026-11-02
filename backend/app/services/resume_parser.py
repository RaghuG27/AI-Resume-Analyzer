import fitz
from docx import Document


def extract_pdf_text(file_path: str) -> str:
    document = fitz.open(file_path)

    text = []

    for page in document:
        page_text = page.get_text()

        if page_text:
            text.append(page_text)

    document.close()

    return "\n".join(text)


def extract_docx_text(file_path: str) -> str:
    document = Document(file_path)

    text = []

    for paragraph in document.paragraphs:
        if paragraph.text.strip():
            text.append(paragraph.text)

    return "\n".join(text)


def extract_resume_text(
    file_path: str,
    file_extension: str
) -> str:

    if file_extension == ".pdf":
        return extract_pdf_text(file_path)

    if file_extension == ".docx":
        return extract_docx_text(file_path)

    raise ValueError("Unsupported file format")