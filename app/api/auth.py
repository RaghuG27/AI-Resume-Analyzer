from fastapi import APIRouter, Depends, HTTPException , Response
from sqlalchemy.orm import Session


from fastapi_limiter.depends import RateLimiter
from fastapi import Depends, Response

from app.core.csrf import require_csrf

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest
)


from app.core.security import get_current_user
from app.core.csrf import generate_csrf_token, set_csrf_cookie

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

@router.post("/register",dependencies=[
        Depends(RateLimiter(times=5, seconds=60)),
    ],)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.email == request.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    user = User(
        email=request.email,
        password_hash=hash_password(
            request.password
        )
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "User registered successfully",
        "user_id": str(user.id),
        "email": user.email
    }





@router.post("/login",dependencies=[
        Depends(RateLimiter(times=5, seconds=60)),
    ],)
def login(
    request: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
    
):

    user = db.query(User).filter(
        User.email == request.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_valid = verify_password(
        request.password,
        user.password_hash
    )

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        str(user.id)
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",       # True when deployed with HTTPS
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    csrf_token = generate_csrf_token()
    set_csrf_cookie(
        response,
        csrf_token,
        secure=settings.ENVIRONMENT == "production",
    )

    return {
        "message": "Login successful",
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

    return {"message": "Logged out successfully"}


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):

    return {
        "id": str(current_user.id),
        "email": current_user.email
    }

