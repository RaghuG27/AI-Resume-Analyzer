
from contextlib import asynccontextmanager

import redis.asyncio as redis
from fastapi import FastAPI,Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

from app.core.config import settings

from app.api.gemini import router as gemini_router
from app.api.resumes import router as resume_router
from app.api.jobs import router as jobs_router
from app.api.analysis import router as analysis_router
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.candidates import router as candidates_router
from app.api.recruitment_applications import (
    router as recruitment_applications_router,
)
from app.api.health import router as health_router
from app.api.companies import router as companies_router
# Error Handling - logging
from app.api.admin import router as admin_router
import logging

from fastapi.exceptions import RequestValidationError

from app.core.logging_config import configure_logging
from app.core.request_id import RequestIDMiddleware
from app.core.exception_handlers import (
    validation_exception_handler,
    unhandled_exception_handler,
)
from app.api.job_applications import router as job_applications_router
from app.api.notifications import router as notifications_router
from app.api.saved_jobs import router as saved_jobs_router
from app.api.admin import router as admin_router

import os
import logging
from urllib.parse import urlparse

import redis.asyncio as redis
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BASE_DIR / ".env", override=False)

@asynccontextmanager
async def lifespan(app: FastAPI):

    redis_url = (
        os.getenv("RATE_LIMIT_REDIS_URL")
        or os.getenv("REDIS_URL")
    )

    if not redis_url:
        raise RuntimeError(
            "Neither RATE_LIMIT_REDIS_URL nor REDIS_URL is configured"
        )

    parsed = urlparse(redis_url)

    # Log connection details without exposing credentials
    logging.info(
        "Redis host=%s port=%s scheme=%s",
        parsed.hostname,
        parsed.port,
        parsed.scheme,
    )

    if parsed.hostname in ("localhost", "127.0.0.1"):
        raise RuntimeError(
            "Production Redis URL points to localhost"
        )

    redis_client = redis.from_url(
        redis_url,
        encoding="utf-8",
        decode_responses=True,
        socket_connect_timeout=10,
        socket_timeout=10,
    )

    try:
        await redis_client.ping()

        await FastAPILimiter.init(redis_client)

        app.state.redis = redis_client

        logging.info("Redis connected successfully")

        yield

    finally:
        await redis_client.aclose()
        logging.info("Redis connection closed")

# Configuring the root logger during application startup initialization so that application log messages can use your JSON formatter.
configure_logging()


app = FastAPI(
    title="AI Resume Analyzer",
    description="AI-powered resume analysis API",
    version="1.0.0",
    lifespan=lifespan,
)

# This Runs middleware for incoming requests. so the middleware generates request_id 
app.add_middleware(RequestIDMiddleware)

# The Exception handlers that handles validation handler formats invalid-request responses as HTTP 422 and generic handler logs unexpected errors and provides a safe HTTP 500 response.
app.add_exception_handler(
    RequestValidationError,
    validation_exception_handler,
)

app.add_exception_handler(
    Exception,
    unhandled_exception_handler,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in settings.CORS_ORIGINS.split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routers.
app.include_router(gemini_router)
app.include_router(resume_router)
app.include_router(jobs_router)
app.include_router(analysis_router)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(candidates_router)
app.include_router(recruitment_applications_router)
app.include_router(health_router)
app.include_router(companies_router)
app.include_router(job_applications_router)
app.include_router(notifications_router)
app.include_router(saved_jobs_router)
# Platform administration
app.include_router(admin_router)

@app.get("/")
def root():
    return {
        "message": "AI Resume Analyzer API",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }


@app.get(
    "/test-rate-limit",
    dependencies=[Depends(RateLimiter(times=3, seconds=60))],
)
async def test_rate_limit():
    return {"message": "Request allowed"}

import os

from fastapi import HTTPException


@app.get("/__test/unexpected-error")
async def test_unexpected_error():
    if os.getenv("ENVIRONMENT", "development") != "development":
        raise HTTPException(status_code=404, detail="Not found")

    raise RuntimeError("Intentional error for testing")