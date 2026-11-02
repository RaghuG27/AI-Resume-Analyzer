
import logging

from fastapi import APIRouter, Depends, HTTPException
from redis import Redis
from redis.exceptions import RedisError
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

router = APIRouter(tags=["Health"])
logger = logging.getLogger(__name__)


@router.get("/health")
def health_check():
    """Check whether the API process is responding."""
    return {
        "status": "ok",
        "service": "resumeai",
    }


@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)):
    """Check whether PostgreSQL and Redis are reachable."""
    checks = {
        "database": "ok",
        "redis": "ok",
    }

    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        checks["database"] = "unavailable"
        logger.exception("Database readiness check failed")

    redis_client = None

    try:
        redis_client = Redis.from_url(
            settings.REDIS_URL,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        redis_client.ping()
    except RedisError:
        checks["redis"] = "unavailable"
        logger.exception("Redis readiness check failed")
    finally:
        if redis_client is not None:
            redis_client.close()

    if any(value != "ok" for value in checks.values()):
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "checks": checks,
            },
        )

    return {
        "status": "ready",
        "checks": checks,
    }
