"""add outbox event lock token

Revision ID: c20cf7fb1af7
Revises: cab2f8747e22
Create Date: 2026-10-30 13:09:17.218520

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c20cf7fb1af7'
down_revision: Union[str, Sequence[str], None] = 'cab2f8747e22'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
