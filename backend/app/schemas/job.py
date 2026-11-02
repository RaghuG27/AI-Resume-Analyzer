from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class JobCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=255,
    )
    description: str = Field(
        min_length=20,
        max_length=20000,
    )


class JobCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(
        min_length=3,
        max_length=255,
    )
    description: str = Field(
        min_length=20,
        max_length=20000,
    )
    location: str | None = Field(
        default=None,
        max_length=255,
    )
    employment_type: str | None = Field(
        default=None,
        max_length=50,
    )

class JobUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=3, max_length=255)
    description: str | None = Field(
        default=None,
        min_length=20,
        max_length=20000,
    )
    location: str | None = Field(default=None, max_length=255)
    employment_type: str | None = Field(default=None, max_length=50)


class JobResponse(BaseModel):
    id: str
    title: str
    description: str


class CompanyJobResponse(BaseModel):
    id: UUID
    company_id: UUID
    created_by_user_id: UUID
    title: str
    description: str
    location: str | None
    employment_type: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


