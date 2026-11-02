
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ApplicationStatusHistoryResponse(BaseModel):
    id: UUID
    application_id: UUID
    changed_by_user_id: UUID
    old_status: str | None
    new_status: str
    reason: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
