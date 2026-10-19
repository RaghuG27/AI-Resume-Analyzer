from pydantic import BaseModel, ConfigDict, Field, field_validator


class EmploymentRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    company: str | None = None
    job_title: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_current: bool = False
    description: str | None = None


class EducationRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    institution: str | None = None
    degree: str | None = None
    field_of_study: str | None = None
    graduation_year: int | None = Field(default=None, ge=1950, le=2100)


class CertificationRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    issuer: str | None = None
    issue_date: str | None = None
    expiry_date: str | None = None


class CandidateProfileExtraction(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str = Field(min_length=1, max_length=255)
    email: str | None = None
    phone: str | None = Field(default=None, max_length=30)
    current_title: str | None = Field(default=None, max_length=255)
    experience_years: float | None = Field(default=None, ge=0, le=70)
    skills: list[str] = Field(default_factory=list)
    summary: str | None = None

    employment_history: list[EmploymentRecord] = Field(default_factory=list)
    education: list[EducationRecord] = Field(default_factory=list)
    certifications: list[CertificationRecord] = Field(default_factory=list)

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Candidate name is required")
        return value

    @field_validator("skills")
    @classmethod
    def clean_skills(cls, values: list[str]) -> list[str]:
        return list(dict.fromkeys(
            skill.strip()
            for skill in values
            if skill and skill.strip()
        ))

    @field_validator("email", "phone", "current_title", "summary")
    @classmethod
    def clean_optional_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None