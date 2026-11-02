from pydantic import BaseModel, Field


class RecruitmentStatusUpdate(BaseModel):
    status: str
    notes: str | None = Field(default=None, max_length=5000)


class RecruitmentStatusHistoryRead(BaseModel):
    id: str
    application_id: str
    changed_by: str
    old_status: str | None
    new_status: str
    notes: str | None
    created_at: str