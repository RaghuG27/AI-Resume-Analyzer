
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.csrf import (
    generate_csrf_token,
    require_csrf,
    set_csrf_cookie,
)
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Public registration always creates a candidate account.

    Admin and recruiter roles must be assigned through
    authorized administrative workflows.
    """

    existing_user = (
        db.query(User)
        .filter(User.email == str(request.email).lower())
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=str(request.email).lower(),
        password_hash=hash_password(request.password),
        role=request.role,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "User registered successfully",
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role,
    }


@router.post(
    "/login",
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
def login(
    request: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = str(request.email).lower()

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user or not verify_password(
        request.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive. Contact the administrator.",
        )

    access_token = create_access_token(str(user.id))

    secure = settings.ENVIRONMENT == "production"

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    csrf_token = generate_csrf_token()

    set_csrf_cookie(
        response,
        csrf_token,
        secure=secure,
    )

    return {
        "message": "Login successful",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
        },
    }


@router.post(
    "/logout",
    dependencies=[Depends(require_csrf)],
)
def logout(response: Response):
    secure = settings.ENVIRONMENT == "production"

    response.delete_cookie(
        key="access_token",
        path="/",
        secure=secure,
        httponly=True,
        samesite="lax",
    )

    response.delete_cookie(
        key="csrf_token",
        path="/",
        secure=secure,
        httponly=False,
        samesite="lax",
    )

    return {
        "message": "Logged out successfully",
    }


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    Return the authenticated user's identity and role.
    """

    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": (
            current_user.created_at.isoformat()
            if current_user.created_at
            else None
        ),
    }
