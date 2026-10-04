import uuid

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text

from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AnalysisJob(Base):

    __tablename__ = "analysis_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    resume_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("resumes.id"),
        nullable=False,
    )

    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id"),
        nullable=False,
    )

    celery_task_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="PENDING",
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )