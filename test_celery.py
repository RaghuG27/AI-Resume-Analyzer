from app.worker.tasks import analyze_resume_task

analyze_resume_task.delay(
    "459a5700-b84d-4327-849d-0777c1ddbc2b",
    "8a3ecc5c-0e07-4a95-ac33-94731f51e382",
    "d2f90735-68ec-4d89-b714-943a195ad73d",
    True,
)