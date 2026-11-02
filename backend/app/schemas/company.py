
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CompanyCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=255)
    website: str | None = Field(default=None, max_length=500)
    description: str | None = Field(default=None, max_length=10000)
    location: str | None = Field(default=None, max_length=255)


class CompanyResponse(BaseModel):
    id: UUID
    name: str
    website: str | None
    description: str | None
    location: str | None
    created_by_user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompanyMembershipResponse(BaseModel):
    company_id: UUID
    company_name: str
    location: str | None = None
    membership_role: str
    status: str
    created_at: datetime
