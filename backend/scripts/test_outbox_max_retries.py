
from backend.app.core.database import SessionLocal
from backend.app.models.outbox_event import OutboxEvent
import backend.app.worker.outbox_tasks as outbox_tasks


def simulate_smtp_failure(recipient, title, message):
    raise RuntimeError("Simulated permanent SMTP failure")


# Create a test event.
with SessionLocal() as db:
    event = OutboxEvent(
        event_type="email.test",
        payload={
            "recipient": "test@example.com",
            "title": "Maximum Retry Test",
            "message": "Testing maximum retry attempts.",
        },
        status="pending",
        attempts=4,
    )

    db.add(event)
    db.commit()
    db.refresh(event)
    event_id = event.id

print("Created test event:", event_id)

# Simulate SMTP failure.
outbox_tasks.send_status_email = simulate_smtp_failure

# Execute worker.
result = outbox_tasks.process_outbox_events.run(batch_size=20)

print("\nWorker result:")
print(result)

# Inspect database.
with SessionLocal() as db:
    event = db.get(OutboxEvent, event_id)

    print("\nFinal database state:")
    print("Status:", event.status)
    print("Attempts:", event.attempts)
    print("Lock token:", event.lock_token)
    print("Locked until:", event.locked_until)
    print("Last error:", event.last_error)
