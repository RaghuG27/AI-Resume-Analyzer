
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select

from backend.app.core.database import SessionLocal
from backend.app.models.outbox_event import OutboxEvent
from backend.app.worker.outbox_tasks import claim_pending_events


EVENT_COUNT = 10
WORKER_COUNT = 2

test_event_ids = []

# Create ten independent pending events.
with SessionLocal() as db:
    for index in range(EVENT_COUNT):
        event = OutboxEvent(
            event_type="email.test",
            payload={
                "recipient": "test@example.com",
                "title": f"Concurrency Test {index}",
                "message": "Testing concurrent outbox workers.",
            },
            status="pending",
            available_at=datetime.now(timezone.utc),
        )

        db.add(event)

    db.commit()

    events = db.execute(
        select(OutboxEvent)
        .where(
            OutboxEvent.status == "pending",
            OutboxEvent.payload["title"].as_string().like(
                "Concurrency Test %"
            ),
        )
    ).scalars().all()

    test_event_ids = [event.id for event in events]

print("Created test events:", len(test_event_ids))


def worker(worker_name):
    claimed = claim_pending_events(batch_size=5)

    ids = [item["id"] for item in claimed]

    print(f"{worker_name} claimed {len(ids)} events")

    return ids


# Execute both workers concurrently.
with ThreadPoolExecutor(max_workers=WORKER_COUNT) as executor:
    futures = [
        executor.submit(worker, "Worker A"),
        executor.submit(worker, "Worker B"),
    ]

    results = [future.result() for future in futures]


worker_a_ids = set(results[0])
worker_b_ids = set(results[1])

print("\nWorker A event IDs:", worker_a_ids)
print("Worker B event IDs:", worker_b_ids)

duplicates = worker_a_ids.intersection(worker_b_ids)

print("\nDuplicate claims:", duplicates)

assert not duplicates, "Same event claimed by multiple workers!"

print("\nConcurrency test passed.")
