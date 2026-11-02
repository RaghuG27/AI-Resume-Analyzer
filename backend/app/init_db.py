"""Development bootstrap: create tables from the SQLAlchemy models.

For an existing production database, use versioned Alembic migrations instead
of running create_all blindly.
"""
from app.core.database import Base, engine
from app import models  # noqa: F401 - register all models

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified.")
