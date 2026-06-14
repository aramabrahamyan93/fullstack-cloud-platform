from sqlalchemy import select
from sqlalchemy.orm import Session

from app.features.organizations.models import Organization, OrganizationInvitation, OrganizationMember
from app.features.users.models import User


def create_organization(db: Session, *, name: str) -> Organization:
    organization = Organization(name=name)
    db.add(organization)
    db.flush()
    db.refresh(organization)
    return organization


def create_organization_member(
    db: Session,
    *,
    organization_id: int,
    user_id: int,
    role: str,
) -> OrganizationMember:
    member = OrganizationMember(
        organization_id=organization_id,
        user_id=user_id,
        role=role,
    )
    db.add(member)
    db.flush()
    db.refresh(member)
    return member


def list_user_organizations(db: Session, *, user_id: int) -> list[Organization]:
    statement = (
        select(Organization)
        .join(
            OrganizationMember,
            OrganizationMember.organization_id == Organization.id,
        )
        .where(OrganizationMember.user_id == user_id)
        .order_by(Organization.id.asc())
    )

    return list(db.scalars(statement).all())


def get_user_organization(
    db: Session,
    *,
    organization_id: int,
    user_id: int,
) -> Organization | None:
    statement = (
        select(Organization)
        .join(
            OrganizationMember,
            OrganizationMember.organization_id == Organization.id,
        )
        .where(Organization.id == organization_id)
        .where(OrganizationMember.user_id == user_id)
    )

    return db.scalars(statement).first()


def get_user_organization_membership(
    db: Session,
    *,
    organization_id: int,
    user_id: int,
) -> OrganizationMember | None:
    statement = (
        select(OrganizationMember)
        .where(OrganizationMember.organization_id == organization_id)
        .where(OrganizationMember.user_id == user_id)
    )

    return db.scalars(statement).first()


def list_organization_members(
    db: Session,
    *,
    organization_id: int,
) -> list[dict[str, int | str]]:
    statement = (
        select(
            OrganizationMember.id,
            OrganizationMember.organization_id,
            OrganizationMember.user_id,
            OrganizationMember.role,
            User.email,
        )
        .join(User, User.id == OrganizationMember.user_id)
        .where(OrganizationMember.organization_id == organization_id)
        .order_by(OrganizationMember.id.asc())
    )

    rows = db.execute(statement).mappings().all()

    return [dict(row) for row in rows]

def get_organization_member_by_user_id(
    db: Session,
    *,
    organization_id: int,
    user_id: int,
) -> OrganizationMember | None:
    statement = (
        select(OrganizationMember)
        .where(OrganizationMember.organization_id == organization_id)
        .where(OrganizationMember.user_id == user_id)
    )

    return db.scalars(statement).first()



def create_organization_invitation(
    db: Session,
    *,
    organization_id: int,
    email: str,
    role: str,
    status: str,
    invited_by_user_id: int,
    token: str,
    expires_at,
):
    invitation = OrganizationInvitation(
        organization_id=organization_id,
        email=email,
        role=role,
        status=status,
        invited_by_user_id=invited_by_user_id,
        token=token,
        expires_at=expires_at,
    )

    db.add(invitation)
    db.flush()
    db.refresh(invitation)

    return invitation


def list_organization_invitations(
    db: Session,
    *,
    organization_id: int,
):
    statement = (
        select(OrganizationInvitation)
        .where(OrganizationInvitation.organization_id == organization_id)
        .order_by(OrganizationInvitation.id.asc())
    )

    return list(db.scalars(statement).all())


def get_organization_invitation_by_id(
    db: Session,
    *,
    organization_id: int,
    invitation_id: int,
):
    statement = (
        select(OrganizationInvitation)
        .where(OrganizationInvitation.organization_id == organization_id)
        .where(OrganizationInvitation.id == invitation_id)
    )

    return db.scalars(statement).first()


def get_pending_organization_invitation_by_email(
    db: Session,
    *,
    organization_id: int,
    email: str,
):
    statement = (
        select(OrganizationInvitation)
        .where(OrganizationInvitation.organization_id == organization_id)
        .where(OrganizationInvitation.email == email)
        .where(OrganizationInvitation.status == "pending")
    )

    return db.scalars(statement).first()
