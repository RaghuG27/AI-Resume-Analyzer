from uuid import UUID

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.company_membership import CompanyMembership


VALID_COMPANY_ROLES = {"owner", "recruiter", "hiring_manager"}


def require_company_membership(*allowed_roles: str):
    if not set(allowed_roles).issubset(VALID_COMPANY_ROLES):
        raise ValueError("Invalid company membership role")

    def company_membership_checker(
        company_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ) -> CompanyMembership:
        membership = (
            db.query(CompanyMembership)
            .filter(
                CompanyMembership.company_id == company_id,
                CompanyMembership.user_id == current_user.id,
                CompanyMembership.status == "active",
            )
            .first()
        )

        if membership is None:
            raise HTTPException(
                status_code=404,
                detail="Company not found",
            )

        if (
            allowed_roles
            and membership.membership_role not in allowed_roles
        ):
            raise HTTPException(
                status_code=403,
                detail="Insufficient company permissions",
            )

        return membership

    return company_membership_checker