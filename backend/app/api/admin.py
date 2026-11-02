
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import require_roles
from app.core.csrf import require_csrf

from app.models.user import User
from app.models.company import Company
from app.models.company_membership import CompanyMembership
from app.models.job import Job
from app.models.job_application import JobApplication


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)


def count_records(db: Session, model) -> int:
    return db.query(func.count(model.id)).scalar() or 0


# ---------------------------------------------------------
# ADMIN DASHBOARD STATISTICS
# ---------------------------------------------------------

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    total_users = count_records(db, User)

    total_candidates = (
        db.query(func.count(User.id))
        .filter(User.role == "candidate")
        .scalar()
        or 0
    )

    total_recruiters = (
        db.query(func.count(User.id))
        .filter(User.role == "recruiter")
        .scalar()
        or 0
    )

    total_admins = (
        db.query(func.count(User.id))
        .filter(User.role == "admin")
        .scalar()
        or 0
    )

    active_users = (
        db.query(func.count(User.id))
        .filter(User.is_active.is_(True))
        .scalar()
        or 0
    )

    inactive_users = (
        db.query(func.count(User.id))
        .filter(User.is_active.is_(False))
        .scalar()
        or 0
    )

    total_companies = count_records(db, Company)
    total_jobs = count_records(db, Job)
    total_applications = count_records(db, JobApplication)

    pending_memberships = (
        db.query(func.count(CompanyMembership.id))
        .filter(CompanyMembership.status == "pending")
        .scalar()
        or 0
    )

    active_memberships = (
        db.query(func.count(CompanyMembership.id))
        .filter(CompanyMembership.status == "active")
        .scalar()
        or 0
    )

    return {
        "users": {
            "total": total_users,
            "candidates": total_candidates,
            "recruiters": total_recruiters,
            "admins": total_admins,
            "active": active_users,
            "inactive": inactive_users,
        },
        "companies": {
            "total": total_companies,
        },
        "jobs": {
            "total": total_jobs,
        },
        "applications": {
            "total": total_applications,
        },
        "memberships": {
            "pending": pending_memberships,
            "active": active_memberships,
        },
    }


# ---------------------------------------------------------
# LIST USERS
# ---------------------------------------------------------

@router.get("/users")
def list_users(
    role: str | None = Query(
        default=None,
        description="Filter by candidate, recruiter or admin",
    ),
    search: str | None = Query(
        default=None,
        min_length=1,
        max_length=255,
    ),
    is_active: bool | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    query = db.query(User)

    allowed_roles = {"candidate", "recruiter", "admin"}

    if role:
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user role",
            )

        query = query.filter(User.role == role)

    if search:
        search_term = f"%{search.strip()}%"

        query = query.filter(
            User.email.ilike(search_term)
        )

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()

    users = (
        query
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "items": [
            {
                "id": str(user.id),
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": (
                    user.created_at.isoformat()
                    if user.created_at
                    else None
                ),
            }
            for user in users
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


# ---------------------------------------------------------
# ACTIVATE / DEACTIVATE USER
# ---------------------------------------------------------

@router.patch(
    "/users/{user_id}/status",
    dependencies=[Depends(require_csrf)],
)
def update_user_status(
    user_id: UUID,
    is_active: bool,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent an administrator from disabling their own account.
    if user.id == admin.id and not is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot deactivate your own account",
        )

    # Protect the platform from losing its last active admin.
    if (
        user.role == "admin"
        and user.is_active
        and not is_active
    ):
        active_admin_count = (
            db.query(func.count(User.id))
            .filter(
                User.role == "admin",
                User.is_active.is_(True),
            )
            .scalar()
            or 0
        )

        if active_admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot deactivate the last active administrator",
            )

    user.is_active = is_active

    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user status",
        )

    return {
        "message": (
            "User activated"
            if is_active
            else "User deactivated"
        ),
        "user": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
        },
    }


# ---------------------------------------------------------
# REJECT RECRUITER COMPANY MEMBERSHIP
# ---------------------------------------------------------

@router.post(
    "/memberships/{membership_id}/reject",
    dependencies=[Depends(require_csrf)],
)
def reject_membership(
    membership_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    membership = db.get(
        CompanyMembership,
        membership_id,
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found",
        )

    if membership.user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot reject your own membership",
        )

    if membership.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending memberships can be rejected",
        )

    # The database constraint permits:
    # pending, active, revoked.
    # Therefore rejection is represented by revoked.
    membership.status = "revoked"

    try:
        db.commit()
        db.refresh(membership)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reject membership",
        )

    return {
        "message": "Membership rejected",
        "membership_id": str(membership.id),
        "company_id": str(membership.company_id),
        "user_id": str(membership.user_id),
        "status": membership.status,
        "rejected_by": str(admin.id),
    }
