
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    db: Session,
    *,
    user_id: UUID,
    notification_type: str,
    title: str,
    message: str,
) -> Notification:
    """Add a notification to the current database transaction."""
    notification = Notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
    )

    db.add(notification)
    return notification
