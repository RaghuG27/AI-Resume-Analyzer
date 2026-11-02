"""add location to companies

Revision ID: 39ba04d77863
Revises: d8b1a5e0d5bc
Create Date: 2026-11-01 19:21:02.133297

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '39ba04d77863'
down_revision: Union[str, Sequence[str], None] = 'd8b1a5e0d5bc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "companies",
        sa.Column("location", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("companies", "location")
