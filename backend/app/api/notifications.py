
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.csrf import require_csrf
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationResponse
from sqlalchemy import func, select

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
)


@router.get("/me", response_model=list[NotificationResponse])
def get_my_notifications(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not 1 <= limit <= 100:
        raise HTTPException(
            status_code=422,
            detail="Limit must be between 1 and 100",
        )

    if offset < 0:
        raise HTTPException(
            status_code=422,
            detail="Offset cannot be negative",
        )

    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.patch(
    "/{notification_id}/read",
    dependencies=[Depends(require_csrf)],
)
def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    notification.is_read = True
    db.commit()

    return {
        "message": "Notification marked as read",
        "notification_id": str(notification.id),
        "is_read": notification.is_read,
    }


@router.patch(
    "/me/read-all",
    dependencies=[Depends(require_csrf)],
)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .update(
            {Notification.is_read: True},
            synchronize_session=False,
        )
    )

    db.commit()

    return {
        "message": "Notifications marked as read",
        "updated_count": updated_count,
    }

@router.get("/unread-count")
def get_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    unread_count = (
        db.query(func.count(Notification.id))
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .scalar()
    )

    return {
        "unread_count": unread_count or 0,
    }