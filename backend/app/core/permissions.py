
from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user
from app.models.user import User


VALID_ROLES = {"candidate", "recruiter", "admin"}


def require_roles(*allowed_roles: str):
    """
    Create a FastAPI dependency that permits only the specified roles.
    """

    if not allowed_roles:
        raise ValueError("At least one allowed role must be specified")

    invalid_roles = set(allowed_roles) - VALID_ROLES
    if invalid_roles:
        raise ValueError(
            f"Invalid role(s): {', '.join(sorted(invalid_roles))}"
        )

    def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )

        return current_user

    return role_checker
