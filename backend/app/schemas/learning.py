from pydantic import BaseModel, Field


class LearningResource(BaseModel):
    title: str
    url: str
    description: str


class InterviewQuestion(BaseModel):
    question: str
    difficulty: str = Field(
        description="beginner, intermediate, or advanced"
    )


class LearningTopic(BaseModel):
    topic: str
    priority: str = Field(
        description="high, medium, or low"
    )
    reason: str

    learning_path: list[str]

    youtube_resources: list[LearningResource]

    website_resources: list[LearningResource]

    interview_questions: list[InterviewQuestion]


class LearningPlan(BaseModel):
    topics: list[LearningTopic]
    overall_advice: str