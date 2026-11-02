
"""add user roles and account status

Revision ID: a5def36a5633
Revises: 36a82270e352
Create Date: 2026-10-20 17:50:20.816704
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a5def36a5633"
down_revision: Union[str, Sequence[str], None] = "36a82270e352"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.String(length=20),
            server_default="candidate",
            nullable=False,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
    )

    op.create_check_constraint(
        "ck_users_role",
        "users",
        "role IN ('candidate', 'recruiter', 'admin')",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_users_role",
        "users",
        type_="check",
    )

    op.drop_column("users", "is_active")
    op.drop_column("users", "role")
