
import logging

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Return a safe, consistent response for invalid requests."""

    request_id = getattr(request.state, "request_id", "unknown")

    errors = [
        {
            "location": [str(part) for part in error.get("loc", [])],
            "message": error.get("msg", "Invalid value"),
            "type": error.get("type", "validation_error"),
        }
        for error in exc.errors()
    ]

    return JSONResponse(
        status_code=422,
        content={
            "detail": "Request validation failed",
            "errors": errors,
            "request_id": request_id,
        },
    )


async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """Log unexpected errors and return a safe response."""

    request_id = getattr(request.state, "request_id", "unknown")

    logger.error(
        "Unhandled application exception",
        exc_info=(type(exc), exc, exc.__traceback__),
        extra={"request_id": request_id},
    )

    return JSONResponse(
    status_code=500,
    content={
        "detail": "An internal server error occurred",
        "request_id": request_id,
        },
        headers={"X-Request-ID": request_id},
    )
