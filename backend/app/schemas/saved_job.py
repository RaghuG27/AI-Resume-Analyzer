from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SavedJobResponse(BaseModel):
    id: UUID
    job_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SavedJobListResponse(BaseModel):
    items: list[SavedJobResponse]
    total: int
    page: int
    page_size: int