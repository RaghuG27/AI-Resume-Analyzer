
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.application_status_history import (
    ApplicationStatusHistory,
)


def record_application_status_change(
    db: Session,
    *,
    application_id: UUID,
    changed_by_user_id: UUID,
    old_status: str,
    new_status: str,
    reason: str | None = None,
) -> ApplicationStatusHistory:
    """Add a status-history record to the current transaction."""
    history = ApplicationStatusHistory(
        application_id=application_id,
        changed_by_user_id=changed_by_user_id,
        old_status=old_status,
        new_status=new_status,
        reason=reason,
    )

    db.add(history)
    return history
