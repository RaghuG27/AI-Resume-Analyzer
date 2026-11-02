
import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CompanyMembership(Base):
    __tablename__ = "company_memberships"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "company_id",
            name="uq_company_membership_user_company",
        ),
        CheckConstraint(
            "membership_role IN ('owner', 'recruiter', 'hiring_manager')",
            name="ck_company_membership_role",
        ),
        CheckConstraint(
            "status IN ('pending', 'active', 'revoked')",
            name="ck_company_membership_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    membership_role: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="recruiter",
        server_default="recruiter",
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        server_default="pending",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
    )
