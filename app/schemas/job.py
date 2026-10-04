
from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=255
    )

    description: str = Field(
        min_length=20
    )


class JobResponse(BaseModel):
    id: str
    title: str
    description: str