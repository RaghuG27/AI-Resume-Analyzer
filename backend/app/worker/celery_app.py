
from celery import Celery
from datetime import timedelta

from app.core.config import settings


celery_app = Celery(
    "resume_analyzer",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.worker.tasks",
        "app.worker.outbox_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    timezone="UTC",
    enable_utc=True,

    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,

    beat_schedule={
        "process-outbox-events-every-30-seconds": {
            "task": "app.worker.outbox_tasks.process_outbox_events",
            "schedule": timedelta(seconds=30),
            "args": (20,),
        },
    },
)
