from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RecruitmentApplicationCreate(BaseModel):
    candidate_id: UUID
    job_id: UUID
    notes: str | None = Field(default=None, max_length=5000)


class RecruitmentApplicationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    candidate_id: UUID
    job_id: UUID
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime