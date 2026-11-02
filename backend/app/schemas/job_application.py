from datetime import datetime
from uuid import UUID
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class JobApplicationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cover_letter: str | None = Field(
        default=None,
        max_length=5000,
    )


class JobApplicationResponse(BaseModel):
    id: UUID
    job_id: UUID
    user_id: UUID
    status: str
    cover_letter: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidateApplicationResponse(JobApplicationResponse):
    job_title: str
    company_id: UUID
    company_name: str


class CompanyApplicationResponse(JobApplicationResponse):
    candidate_email: str
    job_title: str

class ApplicationStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["reviewing", "shortlisted", "rejected"]

    reason: str | None = Field(default=None, max_length=2000)