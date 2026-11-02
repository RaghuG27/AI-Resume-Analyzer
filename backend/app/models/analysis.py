import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    JSON
)

from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Analysis(Base):

    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )

    resume_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("resumes.id"),
        nullable=False
    )

    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id"),
        nullable=False
    )

    overall_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    ats_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    job_match_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    result: Mapped[dict] = mapped_column(
        JSON,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )