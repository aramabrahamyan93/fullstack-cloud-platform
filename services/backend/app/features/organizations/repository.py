from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.public_ids import generate_workspace_public_id
from app.features.organizations.models import Organization, OrganizationAuditLog, OrganizationInvitation, OrganizationMember
from app.features.users.models import User


def create_organization(db: Session, *, name: str) -> Organization:
    organization = Organization(
        name=name,
        public_id=create_unique_organization_public_id(db),
    )
    db.add(organization)
    db.flush()
    db.refresh(organization)
    return organization


def create_unique_organization_public_id(db: Session) -> str:
    for _ in range(10):
        public_id = generate_workspace_public_id()

        if get_organization_by_public_id(db, public_id=public_id) is None:
            return public_id

    raise RuntimeError("Could not generate a unique organization public_id.")


def get_organization_by_public_id(
    db: Session,
    *,
    public_id: str,
) -> Organization | None:
    statement = select(Organization).where(Organization.public_id == public_id)

    return db.scalars(statement).first()


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


def list_user_organizations(db: Session, *, user_id: int) -> list[dict[str, int | str]]:
    statement = (
        select(
            Organization.id,
            Organization.public_id,
            Organization.name,
            OrganizationMember.role,
        )
        .join(
            OrganizationMember,
            OrganizationMember.organization_id == Organization.id,
        )
        .where(OrganizationMember.user_id == user_id)
        .order_by(Organization.id.asc())
    )

    rows = db.execute(statement).mappings().all()

    return [dict(row) for row in rows]


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


def count_organization_members(
    db: Session,
    *,
    organization_id: int,
) -> int:
    statement = select(OrganizationMember).where(
        OrganizationMember.organization_id == organization_id
    )

    return len(list(db.scalars(statement).all()))


def count_organization_invitations(
    db: Session,
    *,
    organization_id: int,
    status: str | None = None,
) -> int:
    statement = select(OrganizationInvitation).where(
        OrganizationInvitation.organization_id == organization_id
    )

    if status is not None:
        statement = statement.where(OrganizationInvitation.status == status)

    return len(list(db.scalars(statement).all()))


def count_organization_audit_logs(
    db: Session,
    *,
    organization_id: int,
) -> int:
    statement = select(OrganizationAuditLog).where(
        OrganizationAuditLog.organization_id == organization_id
    )

    return len(list(db.scalars(statement).all()))

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
    status: str | None = None,
):
    statement = select(OrganizationInvitation).where(
        OrganizationInvitation.organization_id == organization_id
    )

    if status is not None:
        statement = statement.where(OrganizationInvitation.status == status)

    statement = statement.order_by(OrganizationInvitation.id.asc())

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


def list_pending_organization_invitations_by_email(
    db: Session,
    *,
    email: str,
):
    statement = (
        select(OrganizationInvitation)
        .where(OrganizationInvitation.email == email)
        .where(OrganizationInvitation.status == "pending")
        .order_by(OrganizationInvitation.id.asc())
    )

    return list(db.scalars(statement).all())


def get_organization_invitation_by_id_and_email(
    db: Session,
    *,
    invitation_id: int,
    email: str,
):
    statement = (
        select(OrganizationInvitation)
        .where(OrganizationInvitation.id == invitation_id)
        .where(OrganizationInvitation.email == email)
    )

    return db.scalars(statement).first()


def get_pending_organization_invitation_by_user_email(
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


def get_organization_member_by_id(
    db: Session,
    *,
    organization_id: int,
    member_id: int,
) -> OrganizationMember | None:
    statement = (
        select(OrganizationMember)
        .where(OrganizationMember.organization_id == organization_id)
        .where(OrganizationMember.id == member_id)
    )

    return db.scalars(statement).first()


def delete_organization_member(
    db: Session,
    *,
    member: OrganizationMember,
) -> None:
    db.delete(member)
    db.flush()



def create_organization_audit_log(
    db: Session,
    *,
    organization_id: int,
    actor_user_id: int,
    event_type: str,
    metadata_json: dict | None = None,
) -> OrganizationAuditLog:
    audit_log = OrganizationAuditLog(
        organization_id=organization_id,
        actor_user_id=actor_user_id,
        event_type=event_type,
        metadata_json=metadata_json or {},
    )

    db.add(audit_log)
    db.flush()
    db.refresh(audit_log)

    return audit_log


def list_organization_audit_logs(
    db: Session,
    *,
    organization_id: int,
    limit: int = 50,
) -> list[OrganizationAuditLog]:
    statement = (
        select(OrganizationAuditLog)
        .where(OrganizationAuditLog.organization_id == organization_id)
        .order_by(OrganizationAuditLog.id.desc())
        .limit(limit)
    )

    return list(db.scalars(statement).all())
