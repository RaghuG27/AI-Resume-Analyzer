
import hmac
import secrets
from urllib.parse import urlsplit

from fastapi import Header, HTTPException, Request, status
from starlette.responses import Response

from app.core.config import settings


CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
ALLOWED_ORIGINS = {
    origin.strip().rstrip("/").lower()
    for origin in settings.CORS_ORIGINS.split(",")
    if origin.strip()
}


def normalize_origin(value: str | None) -> str | None:
    """Return a normalized HTTP(S) origin, rejecting URLs with paths."""
    if not value:
        return None

    try:
        parsed = urlsplit(value.strip())

        if (
            parsed.scheme.lower() not in {"http", "https"}
            or not parsed.netloc
            or not parsed.hostname
            or parsed.username is not None
            or parsed.password is not None
            or parsed.path not in {"", "/"}
            or parsed.query
            or parsed.fragment
        ):
            return None

        return f"{parsed.scheme.lower()}://{parsed.netloc.lower()}".rstrip("/")
    except ValueError:
        return None


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def set_csrf_cookie(
    response: Response,
    token: str,
    *,
    secure: bool,
) -> None:
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=token,
        httponly=False,
        secure=secure,
        samesite="lax",
        path="/",
    )


async def require_csrf(
    request: Request,
    csrf_header: str | None = Header(
        default=None,
        alias=CSRF_HEADER_NAME,
    ),
) -> None:
    if request.method.upper() in SAFE_METHODS:
        return

    # Check the request's browser origin.
    origin_header = request.headers.get("origin")
    referer_header = request.headers.get("referer")

    source = origin_header if origin_header else referer_header
    normalized_source = normalize_origin(source)

    if (
        normalized_source is None
        or normalized_source not in ALLOWED_ORIGINS
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Untrusted request origin",
        )

    # Validate the double-submit CSRF token.
    cookie_token = request.cookies.get(CSRF_COOKIE_NAME)

    if not cookie_token or not csrf_header:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing",
        )

    if not hmac.compare_digest(cookie_token, csrf_header):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid CSRF token",
        )
