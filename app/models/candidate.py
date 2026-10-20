import uuid

from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    JSON,
    String,
    Text,
    Float,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    # The recruiter/user who owns this candidate
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # Basic candidate information
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    current_title: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    employment_history: Mapped[list] = mapped_column(
    JSON,
    nullable=False,
    default=list,
    )

    education: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    certifications: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    experience_years: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    # Structured candidate information
    skills: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Optional link to the resume used to create the profile
    source_resume_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("resumes.id"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    __table_args__ = (
        Index(
            "ix_candidates_user_email",
            "user_id",
            "email",
        ),
    )