from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RecruitmentBoardItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    candidate_id: UUID
    job_id: UUID
    candidate_name: str
    candidate_email: str | None
    candidate_title: str | None
    job_title: str
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime