from fastapi import APIRouter, Depends, HTTPException , Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)

from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest
)


from app.core.security import get_current_user

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

@router.post("/register")
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


@router.post("/login")
def login(
    request: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
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
        secure=False,       # True when deployed with HTTPS
        samesite="lax",
        max_age=60 * 60,
        path="/",
    )

    return {
        "message": "Login successful",
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        path="/",
    )

    return {
        "message": "Logged out successfully",
    }


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):

    return {
        "id": str(current_user.id),
        "email": current_user.email
    }

