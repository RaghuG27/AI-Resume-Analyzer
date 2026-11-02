
import re


SKILL_ALIASES = {
    "python": ["python"],
    "fastapi": ["fastapi"],
    "django": ["django", "django rest framework", "drf"],
    "flask": ["flask"],
    "javascript": ["javascript", "js"],
    "typescript": ["typescript", "ts"],
    "react": ["react", "react.js"],
    "next.js": ["next.js", "nextjs"],
    "sql": ["sql"],
    "postgresql": ["postgresql", "postgres"],
    "mysql": ["mysql"],
    "redis": ["redis"],
    "celery": ["celery"],
    "docker": ["docker"],
    "kubernetes": ["kubernetes", "k8s"],
    "aws": ["aws", "amazon web services"],
    "gcp": ["gcp", "google cloud platform"],
    "azure": ["azure"],
    "machine learning": ["machine learning", "ml"],
    "generative ai": ["generative ai", "genai", "gen ai"],
    "llm": ["llm", "large language model", "large language models"],
    "rag": ["rag", "retrieval augmented generation"],
    "langchain": ["langchain"],
    "langgraph": ["langgraph"],
    "faiss": ["faiss"],
    "embeddings": ["embeddings", "embedding"],
    "rest api": ["rest api", "rest apis", "restful api"],
    "microservices": ["microservices", "microservice"],
    "kafka": ["kafka", "apache kafka"],
    "git": ["git"],
    "pytest": ["pytest"],
    "pandas": ["pandas"],
    "numpy": ["numpy"],
    "snowflake": ["snowflake"],
    "jenkins": ["jenkins"],
    "gitlab ci": ["gitlab ci"],
    "github actions": ["github actions"],
    "linux": ["linux"],
    "nginx": ["nginx"],
    "websockets": ["websocket", "websockets"],
    "graphql": ["graphql"],
    "mongodb": ["mongodb", "mongo db"],
    "elasticsearch": ["elasticsearch"],
    "rabbitmq": ["rabbitmq"],
}


def normalize_text(text: str) -> str:
    """Normalize text before extracting skills."""
    return re.sub(r"\s+", " ", text.lower()).strip()


def contains_phrase(text: str, phrase: str) -> bool:
    """Match complete phrases rather than partial words."""
    pattern = rf"(?<!\w){re.escape(phrase.lower())}(?!\w)"
    return re.search(pattern, text) is not None


def extract_skills(text: str) -> set[str]:
    """Extract supported skills using the alias dictionary."""

    if not text:
        return set()

    normalized = normalize_text(text)
    found_skills = set()

    for canonical_skill, aliases in SKILL_ALIASES.items():
        if any(
            contains_phrase(normalized, alias)
            for alias in aliases
        ):
            found_skills.add(canonical_skill)

    return found_skills


def calculate_job_match(
    resume_text: str,
    job_description: str,
) -> dict:
    """
    Calculate a deterministic skill overlap score.
    """

    resume_skills = extract_skills(resume_text)
    required_skills = extract_skills(job_description)

    matched_skills = sorted(
        resume_skills & required_skills
    )

    missing_skills = sorted(
        required_skills - resume_skills
    )

    if not required_skills:
        score = 0
    else:
        score = round(
            len(matched_skills)
            / len(required_skills)
            * 100
        )

    return {
        "match_score": score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "resume_skills": sorted(resume_skills),
        "required_skills": sorted(required_skills),
        "scoring_method": "skill_overlap",
    }
