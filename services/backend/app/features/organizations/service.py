from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.features.organizations import repository
from app.features.organizations.models import Organization
from app.features.organizations.schemas import OrganizationCreate
from app.features.users.models import User

ORGANIZATION_ROLE_OWNER = "owner"


def create_user_organization(
    db: Session,
    *,
    current_user: User,
    organization_create: OrganizationCreate,
) -> Organization:
    organization = repository.create_organization(
        db,
        name=organization_create.name,
    )

    repository.create_organization_member(
        db,
        organization_id=organization.id,
        user_id=current_user.id,
        role=ORGANIZATION_ROLE_OWNER,
    )

    db.commit()
    db.refresh(organization)

    return organization


def list_organizations_for_user(
    db: Session,
    *,
    current_user: User,
) -> list[Organization]:
    return repository.list_user_organizations(db, user_id=current_user.id)


def get_organization_for_user(
    db: Session,
    *,
    organization_id: int,
    current_user: User,
) -> Organization:
    organization = repository.get_user_organization(
        db,
        organization_id=organization_id,
        user_id=current_user.id,
    )

    if organization is None:
        raise NotFoundError("Organization not found.")

    return organization
