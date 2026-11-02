from pydantic import BaseModel, Field


class RequirementAnalysis(BaseModel):
    requirement: str
    category: str
    importance: str

    matched: bool
    evidence: str | None
    relevance: int


class GeminiAnalysisResult(BaseModel):
    requirements: list[RequirementAnalysis]

    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]

    summary: str

class AnalysisRequest(BaseModel):
    resume_id: str = Field(..., description="Resume UUID")
    job_id: str | None = Field(
        default=None,
        description="Optional published or personal job UUID",
    )