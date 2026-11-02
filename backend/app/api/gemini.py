from fastapi import APIRouter

# from app.services.gemini_service import generate_text
from app.services.gemini_service import analyze_resume

router = APIRouter(
    prefix="/api/gemini",
    tags=["Gemini"]
)

# @router.get("/test")
# def test_gemini():

#     prompt = """
#     Explain what FastAPI is in 3 simple sentences.
#     """

#     result = generate_text(prompt)

#     return {
#         "response": result
#     }

@router.get("/test-analysis")
def test_analysis():

    resume = """
    John Doe

    Python Backend Developer

    Skills:
    Python
    Django
    Django REST Framework
    PostgreSQL
    Docker
    Redis

    Experience:
    3 years of experience building REST APIs using Django.
    Worked with PostgreSQL and Redis.
    Developed backend services and authentication systems.
    """

    job_description = """
    We are looking for a Python Backend Developer.

    Requirements:

    Python
    Django
    FastAPI
    PostgreSQL
    Docker
    AWS
    Kubernetes
    REST APIs
    Redis
    """

    result = analyze_resume(
        resume_text=resume,
        job_description=job_description
    )

    return result