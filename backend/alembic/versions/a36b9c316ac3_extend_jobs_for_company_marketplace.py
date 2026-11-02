
"""extend jobs for company marketplace

Revision ID: a36b9c316ac3
Revises: e93bff9477b7
Create Date: 2026-10-27 17:42:05.336530
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a36b9c316ac3"
down_revision: Union[str, Sequence[str], None] = "e93bff9477b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add nullable columns first so existing jobs are preserved.
    op.add_column(
        "jobs",
        sa.Column("company_id", sa.Uuid(), nullable=True),
    )
    op.add_column(
        "jobs",
        sa.Column("created_by_user_id", sa.Uuid(), nullable=True),
    )
    op.add_column(
        "jobs",
        sa.Column("location", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "jobs",
        sa.Column("employment_type", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "jobs",
        sa.Column(
            "status",
            sa.String(length=20),
            server_default="draft",
            nullable=False,
        ),
    )

    # Backfill existing rows before making updated_at non-nullable.
    op.add_column(
        "jobs",
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.execute(
        sa.text(
            "UPDATE jobs "
            "SET updated_at = CURRENT_TIMESTAMP "
            "WHERE updated_at IS NULL"
        )
    )
    op.alter_column(
        "jobs",
        "updated_at",
        existing_type=sa.DateTime(),
        nullable=False,
    )

    # Indexes.
    op.create_index(
        op.f("ix_jobs_company_id"),
        "jobs",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_jobs_company_status",
        "jobs",
        ["company_id", "status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_jobs_created_by_user_id"),
        "jobs",
        ["created_by_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_jobs_title"),
        "jobs",
        ["title"],
        unique=False,
    )
    op.create_index(
        op.f("ix_jobs_user_id"),
        "jobs",
        ["user_id"],
        unique=False,
    )

    # Explicitly named foreign keys.
    op.create_foreign_key(
        "fk_jobs_created_by_user_id_users",
        "jobs",
        "users",
        ["created_by_user_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_jobs_company_id_companies",
        "jobs",
        "companies",
        ["company_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Match the status validation in the SQLAlchemy model.
    op.create_check_constraint(
        "ck_jobs_status",
        "jobs",
        "status IN ('draft', 'published', 'closed')",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_jobs_status",
        "jobs",
        type_="check",
    )

    op.drop_constraint(
        "fk_jobs_company_id_companies",
        "jobs",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_jobs_created_by_user_id_users",
        "jobs",
        type_="foreignkey",
    )

    op.drop_index(op.f("ix_jobs_user_id"), table_name="jobs")
    op.drop_index(op.f("ix_jobs_title"), table_name="jobs")
    op.drop_index(
        op.f("ix_jobs_created_by_user_id"),
        table_name="jobs",
    )
    op.drop_index("ix_jobs_company_status", table_name="jobs")
    op.drop_index(op.f("ix_jobs_company_id"), table_name="jobs")

    op.drop_column("jobs", "updated_at")
    op.drop_column("jobs", "status")
    op.drop_column("jobs", "employment_type")
    op.drop_column("jobs", "location")
    op.drop_column("jobs", "created_by_user_id")
    op.drop_column("jobs", "company_id")
