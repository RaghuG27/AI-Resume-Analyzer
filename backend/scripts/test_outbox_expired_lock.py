
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import and_, or_, select, func

from backend.app.core.database import SessionLocal
from backend.app.models.outbox_event import OutboxEvent
from backend.app.worker.outbox_tasks import claim_pending_events


old_token = uuid4()
now = datetime.now(timezone.utc)

# Check that no other events can interfere with this test.
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

    count = db.execute(
        select(func.count())
        .select_from(OutboxEvent)
        .where(eligible)
    ).scalar_one()

    if count:
        raise RuntimeError(
            f"Found {count} other eligible events. "
            "Inspect pending/processing events before running this test."
        )

# Create an event whose processing lock has expired.
with SessionLocal() as db:
    event = OutboxEvent(
        event_type="email.test",
        payload={
            "recipient": "test@example.com",
            "title": "Expired Lock Test",
            "message": "Testing expired lock recovery.",
        },
        status="processing",
        attempts=1,
        locked_until=now - timedelta(minutes=5),
        lock_token=old_token,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    event_id = event.id

print("Created expired event:", event_id)
print("Old token:", old_token)

# Claim the expired event.
claimed = claim_pending_events(batch_size=1)

print("\nClaim result:")
print(claimed)

if len(claimed) != 1:
    raise AssertionError("Expected exactly one event to be reclaimed")

item = claimed[0]

new_token = item["lock_token"]

print("\nVerification:")
print("Attempts:", item["attempts"])
print("New token:", new_token)
print("Token changed:", new_token != str(old_token))

assert item["id"] == str(event_id)
assert item["attempts"] == 2
assert new_token != str(old_token)

with SessionLocal() as db:
    event = db.get(OutboxEvent, event_id)

    print("\nFinal database state:")
    print("Status:", event.status)
    print("Attempts:", event.attempts)
    print("Lock token:", event.lock_token)
    print("Locked until:", event.locked_until)

    assert event.status == "processing"
    assert event.attempts == 2
    assert str(event.lock_token) == new_token

print("\nExpired lock recovery test passed.")
