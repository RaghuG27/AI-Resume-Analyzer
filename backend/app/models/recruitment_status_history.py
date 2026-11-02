import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RecruitmentStatusHistory(Base):
    __tablename__ = "recruitment_status_history"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    application_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "recruitment_applications.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    # Recruiter who performed the status change
    changed_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    old_status: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    new_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    __table_args__ = (
        Index(
            "ix_recruitment_history_application_created",
            "application_id",
            "created_at",
        ),
    )