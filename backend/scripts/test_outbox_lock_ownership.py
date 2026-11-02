
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from backend.app.core.database import SessionLocal
from backend.app.models.outbox_event import OutboxEvent
from backend.app.worker.outbox_tasks import (
    record_delivery_success,
    record_delivery_failure,
)


now = datetime.now(timezone.utc)

# Simulate Worker A's old token and Worker B's current token.
old_token = uuid4()
current_token = uuid4()

# Create two events to test stale success and stale failure.
with SessionLocal() as db:
    success_event = OutboxEvent(
        event_type="email.test",
        payload={"recipient": "test@example.com"},
        status="processing",
        attempts=2,
        lock_token=current_token,
        locked_until=now + timedelta(minutes=10),
    )

    failure_event = OutboxEvent(
        event_type="email.test",
        payload={"recipient": "test@example.com"},
        status="processing",
        attempts=2,
        lock_token=current_token,
        locked_until=now + timedelta(minutes=10),
    )

    db.add_all([success_event, failure_event])
    db.commit()

    db.refresh(success_event)
    db.refresh(failure_event)

    success_id = success_event.id
    failure_id = failure_event.id

print("Created test events.")
print("Old token:", old_token)
print("Current token:", current_token)


# Test 1: Old worker attempts to mark event as sent.
success_updated = record_delivery_success(
    event_id=success_id,
    lock_token=old_token,
)

print("\nStale success update:", success_updated)

assert success_updated is False


# Test 2: Old worker attempts to mark event as failed.
failure_updated = record_delivery_failure(
    event_id=failure_id,
    lock_token=old_token,
    attempts=2,
    error=RuntimeError("Stale worker failure"),
)

print("Stale failure update:", failure_updated)

assert failure_updated is False


# Verify that Worker B still owns both events.
with SessionLocal() as db:
    success_event = db.get(OutboxEvent, success_id)
    failure_event = db.get(OutboxEvent, failure_id)

    assert success_event.status == "processing"
    assert success_event.lock_token == current_token

    assert failure_event.status == "processing"
    assert failure_event.lock_token == current_token

    print("\nDatabase verification:")
    print("Success event status:", success_event.status)
    print("Failure event status:", failure_event.status)
    print("Success event token preserved:", success_event.lock_token == current_token)
    print("Failure event token preserved:", failure_event.lock_token == current_token)

print("\nLock ownership test passed.")


# Remove test records.
with SessionLocal() as db:
    db.query(OutboxEvent).filter(
        OutboxEvent.id.in_([success_id, failure_id])
    ).delete(synchronize_session=False)

    db.commit()

print("Temporary test events cleaned up.")
