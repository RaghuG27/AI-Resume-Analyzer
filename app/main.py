from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.api.gemini import router as gemini_router
from app.api.resumes import router as resume_router
from app.api.jobs import router as jobs_router
from app.core.database import engine
from app.api.analysis import router as analysis_router
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router

app = FastAPI(
    title="AI Resume Analyzer",
    description="AI-powered resume analysis API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gemini_router)
app.include_router(resume_router)
app.include_router(jobs_router)
app.include_router(analysis_router)
app.include_router(auth_router)
app.include_router(dashboard_router)

@app.get("/")
def root():
    return {
        "message": "AI Resume Analyzer API"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


