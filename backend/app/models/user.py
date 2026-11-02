import uuid
from datetime import datetime

from sqlalchemy import Boolean,CheckConstraint,DateTime, String,text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):

    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint(
            "role IN ('candidate', 'recruiter', 'admin')",
            name="ck_users_role",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="candidate",
        server_default="candidate",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )