"""Ensure outbox lock token exists."""

from alembic import op
import sqlalchemy as sa

revision = "af6d07a16009"
down_revision = "c20cf7fb1af7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "outbox_events",
        sa.Column("lock_token", sa.Uuid(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("outbox_events", "lock_token")