
from app.models.outbox_event import OutboxEvent


def enqueue_outbox_event(
    db,
    *,
    event_type: str,
    payload: dict,
) -> OutboxEvent:
    """Add an event to the current database transaction."""
    event = OutboxEvent(
        event_type=event_type,
        payload=payload,
        status="pending",
    )

    db.add(event)
    return event
