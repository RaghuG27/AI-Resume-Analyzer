from google import genai
from google.genai import types

from app.core.config import settings
from app.schemas.learning import LearningPlan


client = genai.Client(
    api_key=settings.GEMINI_API_KEY
)


def generate_learning_plan(
    resume_text: str,
    job_description: str,
    requirements: list[dict],
) -> LearningPlan:

    missing_requirements = [
        requirement
        for requirement in requirements
        if not requirement.get("matched", False)
    ]

    weak_requirements = [
        requirement
        for requirement in requirements
        if (
            requirement.get("matched", False)
            and requirement.get("relevance", 0) < 70
        )
    ]

    learning_requirements = (
        missing_requirements +
        weak_requirements
    )

    if not learning_requirements:
        return LearningPlan(
            topics=[],
            overall_advice=(
                "No significant learning gaps were "
                "identified from this analysis."
            ),
        )

    prompt = f"""
You are an AI career learning assistant.

Your job is to create a personalized learning plan
based on a candidate's resume and a target job description.

IMPORTANT RULES:

1. Only recommend learning topics that are supported
   by the job description or the identified weak areas.

2. Prioritize missing REQUIRED skills first.

3. Do not claim that the candidate has a skill unless
   the resume provides evidence.

4. Do not invent experience.

5. For YouTube resources:
   - Recommend well-known, established educational channels
     (e.g. freeCodeCamp, Traversy Media, official product channels).
   - Prefer channel or search URLs you are confident exist,
     such as https://www.youtube.com/@freecodecamp or a
     YouTube search URL like
     https://www.youtube.com/results?search_query=<topic>.
   - Do NOT fabricate specific video IDs or deep video URLs
     you are not certain about.
   - Prefer beginner/intermediate tutorials depending
     on the candidate's apparent level.

6. For website resources:
   - Prefer official documentation on stable, well-known domains
     (e.g. https://docs.python.org, https://developer.mozilla.org,
     https://reactjs.org, https://www.postgresql.org/docs).
   - Prefer authoritative educational websites you are confident
     exist.
   - Only return URLs you are highly confident are real and stable.

7. Interview questions must be specific to:
   - the missing/weak skill
   - the target job
   - the candidate's existing experience

8. Generate:
   - learning path
   - YouTube tutorials
   - websites/documentation
   - beginner questions
   - intermediate questions
   - advanced questions

9. Do not generate fake URLs. If you are not confident a
   specific URL is real, use the official site's homepage or a
   YouTube search URL instead of inventing a deep link.

10. Keep the number of topics between 1 and 5.

11. For each topic provide 3-6 learning steps.

12. Provide 2-4 YouTube resources.

13. Provide 2-4 website resources.

14. Provide 3-6 interview questions.

RESUME:

{resume_text}

JOB DESCRIPTION:

{job_description}

IDENTIFIED REQUIREMENTS:

{learning_requirements}

Return only the requested structured JSON.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=LearningPlan,
        ),
    )

    return LearningPlan.model_validate_json(
        response.text
    )