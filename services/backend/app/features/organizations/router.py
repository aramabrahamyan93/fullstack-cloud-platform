from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.dependencies import get_current_user, get_db
from app.features.organizations.schemas import OrganizationCreate, OrganizationRead
from app.features.organizations.service import (
    create_user_organization,
    get_organization_for_user,
    list_organizations_for_user,
)
from app.features.users.models import User

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post("", response_model=OrganizationRead, status_code=201)
def create_organization(
    organization_create: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationRead:
    return create_user_organization(
        db,
        current_user=current_user,
        organization_create=organization_create,
    )


@router.get("", response_model=list[OrganizationRead])
def list_organizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OrganizationRead]:
    return list_organizations_for_user(db, current_user=current_user)


@router.get("/{organization_id}", response_model=OrganizationRead)
def get_organization(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationRead:
    return get_organization_for_user(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )
