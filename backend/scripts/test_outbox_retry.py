
from backend.app.core.database import SessionLocal
from backend.app.models.outbox_event import OutboxEvent
import backend.app.worker.outbox_tasks as outbox_tasks


# Simulate an SMTP failure.
def simulate_smtp_failure(recipient, title, message):
    raise RuntimeError("Simulated SMTP failure for retry testing")


# Create a test event.
with SessionLocal() as db:
    event = OutboxEvent(
        event_type="email.test",
        payload={
            "recipient": "test@example.com",
            "title": "Retry Test",
            "message": "Testing outbox retry mechanism.",
        },
        status="pending",
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    event_id = event.id

print("Created test event:", event_id)


# Replace SMTP delivery with our simulated failure.
outbox_tasks.send_status_email = simulate_smtp_failure


# Execute the outbox worker.
result = outbox_tasks.process_outbox_events.run(batch_size=20)

print("\nWorker result:")
print(result)


# Inspect the event after processing.
with SessionLocal() as db:
    event = db.get(OutboxEvent, event_id)

    print("\nDatabase state:")
    print("Status:", event.status)
    print("Attempts:", event.attempts)
    print("Lock token:", event.lock_token)
    print("Locked until:", event.locked_until)
    print("Available at:", event.available_at)
    print("Last error:", event.last_error)
