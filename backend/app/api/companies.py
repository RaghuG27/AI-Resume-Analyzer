
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.company_permissions import require_company_membership
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import require_roles
from app.core.csrf import require_csrf
from app.models.user import User
from app.models.company import Company
from app.models.company_membership import CompanyMembership
from app.schemas.company import (
    CompanyCreateRequest,
    CompanyResponse,
    CompanyMembershipResponse,
)


router = APIRouter(
    prefix="/api/companies",
    tags=["Companies"],
)


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_csrf)],
)
def create_company(
    request: CompanyCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("recruiter", "admin")
    ),
):
    company = Company(
        name=request.name.strip(),
        website=str(request.website).strip()
        if request.website and str(request.website).strip()
        else None,
        description=request.description.strip()
        if request.description and request.description.strip()
        else None,
        location=request.location.strip()
        if request.location and request.location.strip()
        else None,
        created_by_user_id=current_user.id,
    )

    try:
        db.add(company)
        db.flush()

        membership = CompanyMembership(
            user_id=current_user.id,
            company_id=company.id,
            membership_role="owner",
            status="pending",
        )

        db.add(membership)
        db.commit()
        db.refresh(company)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create company",
        )

    return {
        "message": "Company created; owner membership is pending approval",
        "company": CompanyResponse.model_validate(company),
        "membership_status": "pending",
    }


@router.get("/me")
def get_my_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memberships = (
        db.query(CompanyMembership, Company)
        .join(
            Company,
            Company.id == CompanyMembership.company_id,
        )
        .filter(
            CompanyMembership.user_id == current_user.id,
            CompanyMembership.status != "revoked",
        )
        .order_by(CompanyMembership.created_at.desc())
        .all()
    )

    return [
        CompanyMembershipResponse(
            company_id=company.id,
            company_name=company.name,
            location=company.location,
            membership_role=membership.membership_role,
            status=membership.status,
            created_at=membership.created_at,
        )
        for membership, company in memberships
    ]


@router.get("/{company_id:uuid}", response_model=CompanyResponse)
def get_company(
    company_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = db.get(Company, company_id)

    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    # Platform administrators may inspect company records.
    if current_user.role == "admin":
        return company

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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    return company


@router.get("/{company_id}/jobs/permissions")
def check_job_management_access(
    company_id: UUID,
    membership: CompanyMembership = Depends(
        require_company_membership("owner", "recruiter")
    ),
):
    return {
        "company_id": str(company_id),
        "membership_role": membership.membership_role,
        "can_manage_jobs": True,
    }


@router.get(
    "/admin/pending-memberships",
)
def list_pending_memberships(
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    pending_memberships = (
        db.query(CompanyMembership, Company, User)
        .join(
            Company,
            Company.id == CompanyMembership.company_id,
        )
        .join(
            User,
            User.id == CompanyMembership.user_id,
        )
        .filter(
            CompanyMembership.status == "pending",
        )
        .order_by(CompanyMembership.created_at.asc())
        .all()
    )

    return [
        {
            "membership_id": str(membership.id),
            "company_id": str(company.id),
            "company_name": company.name,
            "user_id": str(member.id),
            "user_email": member.email,
            "membership_role": membership.membership_role,
            "status": membership.status,
            "created_at": membership.created_at,
        }
        for membership, company, member in pending_memberships
    ]


@router.post(
    "/admin/memberships/{membership_id}/approve",
    dependencies=[Depends(require_csrf)],
)
def approve_membership(
    membership_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    membership = db.get(CompanyMembership, membership_id)

    if membership is None:
        raise HTTPException(
            status_code=404,
            detail="Membership not found",
        )

    # Prevent an administrator from approving their own membership.
    if membership.user_id == admin.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot approve your own membership",
        )

    if membership.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="Only pending memberships can be approved",
        )

    membership.status = "active"

    try:
        db.commit()
        db.refresh(membership)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to approve membership",
        )

    return {
        "message": "Membership approved",
        "membership_id": str(membership.id),
        "company_id": str(membership.company_id),
        "user_id": str(membership.user_id),
        "membership_role": membership.membership_role,
        "status": membership.status,
        "approved_by": str(admin.id),
    }
