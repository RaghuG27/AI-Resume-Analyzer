
import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from sqlalchemy import and_, or_, select, update

from app.core.database import SessionLocal
from app.models.outbox_event import OutboxEvent
from app.worker.celery_app import celery_app
from app.worker.notification_tasks import send_status_email


logger = logging.getLogger(__name__)

BATCH_SIZE = 20
MAX_ATTEMPTS = 5

# Allow enough time for sequential processing of a batch.
LOCK_DURATION_SECONDS = 600

BASE_RETRY_DELAY_SECONDS = 30
MAX_RETRY_DELAY_SECONDS = 3600

SUPPORTED_EMAIL_EVENT_TYPES = {
    "email.test",
    "email.application_status_changed",
    "email.application_withdrawn",
}


class PermanentOutboxEventError(ValueError):
    """An event that cannot succeed by retrying."""


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def claim_pending_events(batch_size: int = BATCH_SIZE) -> list[dict]:
    """
    Claim pending events and recover events with expired locks.

    Each claim receives a unique lock token. The token identifies
    the worker that currently owns the event.
    """
    now = utc_now()
    claimed = []

    with SessionLocal() as db:
        eligible = or_(
            and_(
                OutboxEvent.status == "pending",
                OutboxEvent.available_at <= now,
            ),
            and_(
                OutboxEvent.status == "processing",
                or_(
                    OutboxEvent.locked_until.is_(None),
                    OutboxEvent.locked_until <= now,
                ),
            ),
        )

        statement = (
            select(OutboxEvent)
            .where(eligible)
            .order_by(OutboxEvent.created_at, OutboxEvent.id)
            .limit(batch_size)
            .with_for_update(skip_locked=True)
        )

        events = db.execute(statement).scalars().all()

        for event in events:
            if event.attempts >= MAX_ATTEMPTS:
                event.status = "failed"
                event.locked_until = None
                event.lock_token = None
                continue

            lock_token = uuid4()

            event.status = "processing"
            event.attempts += 1
            event.lock_token = lock_token
            event.locked_until = now + timedelta(
                seconds=LOCK_DURATION_SECONDS
            )

            claimed.append(
                {
                    "id": str(event.id),
                    "event_type": event.event_type,
                    "payload": dict(event.payload),
                    "attempts": event.attempts,
                    "lock_token": str(lock_token),
                }
            )

        db.commit()

    return claimed


def record_delivery_success(
    event_id: UUID,
    lock_token: UUID,
) -> bool:
    """
    Mark an event as sent only if this worker still owns its lock.
    """
    with SessionLocal() as db:
        result = db.execute(
            update(OutboxEvent)
            .where(
                OutboxEvent.id == event_id,
                OutboxEvent.status == "processing",
                OutboxEvent.lock_token == lock_token,
            )
            .values(
                status="sent",
                sent_at=utc_now(),
                locked_until=None,
                lock_token=None,
                last_error=None,
            )
        )

        db.commit()

        if result.rowcount != 1:
            logger.warning(
                "Could not mark outbox event %s as sent: "
                "lock ownership was lost",
                event_id,
            )
            return False

        return True


def record_delivery_failure(
    event_id: UUID,
    lock_token: UUID,
    attempts: int,
    error: Exception,
    permanent: bool = False,
) -> bool:
    """
    Record failure only if this worker still owns the event.

    Permanent errors are marked failed immediately.
    Temporary errors are scheduled for retry.
    """
    now = utc_now()

    values = {
        "last_error": str(error)[:4000],
        "locked_until": None,
        "lock_token": None,
    }

    if permanent or attempts >= MAX_ATTEMPTS:
        values["status"] = "failed"

    else:
        delay = min(
            BASE_RETRY_DELAY_SECONDS * (2 ** (attempts - 1)),
            MAX_RETRY_DELAY_SECONDS,
        )

        values["status"] = "pending"
        values["available_at"] = now + timedelta(seconds=delay)

    with SessionLocal() as db:
        result = db.execute(
            update(OutboxEvent)
            .where(
                OutboxEvent.id == event_id,
                OutboxEvent.status == "processing",
                OutboxEvent.lock_token == lock_token,
            )
            .values(**values)
        )

        db.commit()

        if result.rowcount != 1:
            logger.warning(
                "Could not record failure for outbox event %s: "
                "lock ownership was lost",
                event_id,
            )
            return False

    if permanent or attempts >= MAX_ATTEMPTS:
        logger.error(
            "Outbox event %s permanently failed after %s attempts: %s",
            event_id,
            attempts,
            error,
        )
    else:
        logger.warning(
            "Outbox event %s retry scheduled in %s seconds",
            event_id,
            delay,
        )

    return True


@celery_app.task(
    name="app.worker.outbox_tasks.process_outbox_events",
    ignore_result=False,
)
def process_outbox_events(batch_size: int = BATCH_SIZE) -> dict:
    """
    Process one batch of outbox events.

    Only one batch is processed per invocation.
    """
    # Keep the batch bounded because emails are sent sequentially.
    safe_batch_size = max(1, min(batch_size, BATCH_SIZE))

    claimed = claim_pending_events(batch_size=safe_batch_size)

    sent = 0
    retried = 0
    failed = 0
    lock_lost = 0

    for item in claimed:
        event_id = UUID(item["id"])
        lock_token = UUID(item["lock_token"])
        attempts = item["attempts"]
        payload = item["payload"]

        try:
            if item["event_type"] not in SUPPORTED_EMAIL_EVENT_TYPES:
                raise PermanentOutboxEventError(
                    f"Unsupported outbox event type: "
                    f"{item['event_type']}"
                )

            recipient = payload.get("recipient")
            title = payload.get("title")
            message = payload.get("message")

            if not all(
                isinstance(value, str) and value.strip()
                for value in (recipient, title, message)
            ):
                raise PermanentOutboxEventError(
                    "Outbox payload requires non-empty recipient, "
                    "title, and message strings"
                )

            # Send email using the existing SMTP implementation.
            send_status_email(
                recipient=recipient,
                title=title,
                message=message,
            )

            updated = record_delivery_success(
                event_id=event_id,
                lock_token=lock_token,
            )

            if updated:
                sent += 1
            else:
                lock_lost += 1

        except Exception as exc:
            logger.exception(
                "Failed processing outbox event %s (type=%s)",
                event_id,
                item["event_type"],
            )

            permanent = isinstance(exc, PermanentOutboxEventError)

            try:
                updated = record_delivery_failure(
                    event_id=event_id,
                    lock_token=lock_token,
                    attempts=attempts,
                    error=exc,
                    permanent=permanent,
                )

                if not updated:
                    lock_lost += 1
                elif permanent or attempts >= MAX_ATTEMPTS:
                    failed += 1
                else:
                    retried += 1

            except Exception:
                logger.exception(
                    "Could not record failure for outbox event %s. "
                    "It can be recovered after its lock expires.",
                    event_id,
                )

    result = {
        "claimed": len(claimed),
        "sent": sent,
        "retry_scheduled": retried,
        "failed": failed,
        "lock_lost": lock_lost,
    }

    logger.info("Outbox batch finished: %s", result)

    return result
