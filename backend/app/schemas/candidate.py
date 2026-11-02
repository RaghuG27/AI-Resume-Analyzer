from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CandidateCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=30)
    current_title: str | None = Field(default=None, max_length=255)
    experience_years: float | None = Field(default=None, ge=0)
    skills: list[str] = Field(default_factory=list)
    summary: str | None = None
    source_resume_id: UUID | None = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Full name cannot be empty")
        return value

    @field_validator("email", "phone", "current_title")
    @classmethod
    def normalize_optional_strings(cls, value: str | None) -> str | None:
        if value is not None:
            value = value.strip()
            return value or None
        return value


class CandidateUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=30)
    current_title: str | None = Field(default=None, max_length=255)
    experience_years: float | None = Field(default=None, ge=0)
    skills: list[str] | None = None
    summary: str | None = None
    source_resume_id: UUID | None = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Full name cannot be empty")
        return value

    @field_validator("email", "phone", "current_title")
    @classmethod
    def normalize_optional_strings(cls, value: str | None) -> str | None:
        if value is not None:
            value = value.strip()
            return value or None
        return value


class CandidateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    full_name: str
    email: str | None
    phone: str | None
    current_title: str | None
    experience_years: float | None
    skills: list[str]
    summary: str | None
    source_resume_id: UUID | None
    created_at: datetime
    updated_at: datetime
    employment_history: list[dict] = Field(default_factory=list)
    education: list[dict] = Field(default_factory=list)
    certifications: list[dict] = Field(default_factory=list)