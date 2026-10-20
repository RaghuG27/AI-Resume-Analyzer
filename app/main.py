
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis_client = redis.from_url(
        settings.RATE_LIMIT_REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )

    try:
        # Verify Redis is reachable.
        await redis_client.ping()

        # Initialize Redis-backed API rate limiting.
        await FastAPILimiter.init(redis_client)

        app.state.rate_limit_redis = redis_client

        yield

    finally:
        # Close the Redis connection during shutdown,
        # including if initialization or application startup fails.
        await redis_client.aclose()


app = FastAPI(
    title="AI Resume Analyzer",
    description="AI-powered resume analysis API",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
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
