from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    DATABASE_URL: str
    ENVIRONMENT: str = "development"
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    REDIS_URL: str = "redis://localhost:6379/0"
    RATE_LIMIT_REDIS_URL: str = "redis://localhost:6379/1"

    class Config:
        env_file = ".env"

settings = Settings()