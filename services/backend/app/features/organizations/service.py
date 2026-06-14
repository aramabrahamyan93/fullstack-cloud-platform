from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.errors import ForbiddenError, NotFoundError
from app.features.organizations import repository
from app.features.organizations.models import Organization, OrganizationMember, OrganizationInvitation
from app.features.organizations.schemas import OrganizationCreate
from app.features.organizations.schemas import OrganizationMemberCreate
from app.features.organizations.schemas import OrganizationInvitationCreate
from app.features.users import repository as users_repository
from app.features.users.models import User

ORGANIZATION_ROLE_OWNER = "owner"
ORGANIZATION_ROLE_MEMBER = "member"


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


def get_user_organization_membership(
    db: Session,
    *,
    organization_id: int,
    current_user: User,
) -> OrganizationMember | None:
    return repository.get_user_organization_membership(
        db,
        organization_id=organization_id,
        user_id=current_user.id,
    )


def ensure_user_is_organization_member(
    db: Session,
    *,
    organization_id: int,
    current_user: User,
) -> OrganizationMember:
    membership = get_user_organization_membership(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

    if membership is None:
        raise NotFoundError("Organization not found.")

    return membership


def ensure_user_is_organization_owner(
    db: Session,
    *,
    organization_id: int,
    current_user: User,
) -> OrganizationMember:
    membership = ensure_user_is_organization_member(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

    if membership.role != ORGANIZATION_ROLE_OWNER:
        raise ForbiddenError("Organization owner role is required.")

    return membership

def list_members_for_user_organization(
    db: Session,
    *,
    organization_id: int,
    current_user: User,
) -> list[dict[str, int | str]]:
    ensure_user_is_organization_member(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

    return repository.list_organization_members(
        db,
        organization_id=organization_id,
    )

def add_member_to_user_organization(
    db: Session,
    *,
    organization_id: int,
    current_user: User,
    member_create: OrganizationMemberCreate,
) -> dict[str, int | str]:
    ensure_user_is_organization_owner(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

    if member_create.role != ORGANIZATION_ROLE_MEMBER:
        raise ForbiddenError(
            "Only member role can be assigned for now.",
            error_code="workspace_member_invalid_role",
        )

    user_to_add = users_repository.get_user_by_email(
        db,
        email=str(member_create.email),
    )

    if user_to_add is None:
        raise NotFoundError(
            "User not found.",
            error_code="workspace_member_user_not_registered",
        )

    if user_to_add.id == current_user.id:
        raise ForbiddenError(
            "You cannot add yourself as a member.",
            error_code="workspace_member_self_add_not_allowed",
        )

    existing_member = repository.get_organization_member_by_user_id(
        db,
        organization_id=organization_id,
        user_id=user_to_add.id,
    )

    if existing_member is not None:
        raise ForbiddenError(
            "User is already a workspace member.",
            error_code="workspace_member_already_exists",
        )

    member = repository.create_organization_member(
        db,
        organization_id=organization_id,
        user_id=user_to_add.id,
        role=ORGANIZATION_ROLE_MEMBER,
    )

    db.commit()
    db.refresh(member)

    return {
        "id": member.id,
        "organization_id": member.organization_id,
        "user_id": member.user_id,
        "role": member.role,
        "email": user_to_add.email,
    }


ORGANIZATION_INVITATION_STATUS_PENDING = "pending"
ORGANIZATION_INVITATION_STATUS_CANCELLED = "cancelled"
ORGANIZATION_INVITATION_STATUS_ACCEPTED = "accepted"
ORGANIZATION_INVITATION_STATUS_DECLINED = "declined"
ORGANIZATION_INVITATION_STATUS_EXPIRED = "expired"
ORGANIZATION_INVITATION_EXPIRATION_DAYS = 7


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def create_user_organization_invitation(
    db: Session,
    *,
    organization_id: int,
    current_user: User,
    invitation_create: OrganizationInvitationCreate,
):
    ensure_user_is_organization_owner(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

    if invitation_create.role != ORGANIZATION_ROLE_MEMBER:
        raise ForbiddenError(
            "Only member role can be invited for now.",
            error_code="workspace_invitation_invalid_role",
        )

    email = _normalize_email(str(invitation_create.email))

    invited_user = users_repository.get_user_by_email(
        db,
        email=email,
    )

    if invited_user is not None:
        existing_member = repository.get_organization_member_by_user_id(
            db,
            organization_id=organization_id,
            user_id=invited_user.id,
        )

        if existing_member is not None:
            raise ForbiddenError(
                "User is already a workspace member.",
                error_code="workspace_invitation_user_already_member",
            )

    existing_invitation = repository.get_pending_organization_invitation_by_email(
        db,
        organization_id=organization_id,
        email=email,
    )

    if existing_invitation is not None:
        raise ForbiddenError(
            "A pending invitation already exists for this email.",
            error_code="workspace_invitation_already_pending",
        )

    from datetime import datetime, timedelta, timezone
    import secrets

    invitation = repository.create_organization_invitation(
        db,
        organization_id=organization_id,
        email=email,
        role=ORGANIZATION_ROLE_MEMBER,
        status=ORGANIZATION_INVITATION_STATUS_PENDING,
        invited_by_user_id=current_user.id,
        token=secrets.token_urlsafe(32),
        expires_at=datetime.now(timezone.utc)
        + timedelta(days=ORGANIZATION_INVITATION_EXPIRATION_DAYS),
    )

    db.commit()
    db.refresh(invitation)

    return invitation


def list_user_organization_invitations(
    db: Session,
    *,
    organization_id: int,
    current_user: User,
):
    ensure_user_is_organization_owner(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

    return repository.list_organization_invitations(
        db,
        organization_id=organization_id,
        status=ORGANIZATION_INVITATION_STATUS_PENDING,
    )


def cancel_user_organization_invitation(
    db: Session,
    *,
    organization_id: int,
    invitation_id: int,
    current_user: User,
) -> None:
    ensure_user_is_organization_owner(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

    invitation = repository.get_organization_invitation_by_id(
        db,
        organization_id=organization_id,
        invitation_id=invitation_id,
    )

    if invitation is None:
        raise NotFoundError("Invitation not found.")

    invitation.status = ORGANIZATION_INVITATION_STATUS_CANCELLED

    db.commit()


def _ensure_invitation_is_pending(invitation: OrganizationInvitation) -> None:
    if invitation.status != ORGANIZATION_INVITATION_STATUS_PENDING:
        raise ForbiddenError(
            "Invitation is not pending.",
            error_code="workspace_invitation_not_pending",
        )


def _ensure_invitation_is_not_expired(invitation: OrganizationInvitation) -> None:
    expires_at = invitation.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at <= datetime.now(timezone.utc):
        invitation.status = ORGANIZATION_INVITATION_STATUS_EXPIRED

        raise ForbiddenError(
            "Invitation has expired.",
            error_code="workspace_invitation_expired",
        )


def list_current_user_pending_invitations(
    db: Session,
    *,
    current_user: User,
) -> list[OrganizationInvitation]:
    email = _normalize_email(current_user.email)

    invitations = repository.list_pending_organization_invitations_by_email(
        db,
        email=email,
    )

    active_invitations: list[OrganizationInvitation] = []

    for invitation in invitations:
        try:
            _ensure_invitation_is_not_expired(invitation)
        except ForbiddenError:
            continue

        active_invitations.append(invitation)

    db.commit()

    return active_invitations


def accept_current_user_invitation(
    db: Session,
    *,
    invitation_id: int,
    current_user: User,
) -> dict[str, int | str]:
    email = _normalize_email(current_user.email)

    invitation = repository.get_organization_invitation_by_id_and_email(
        db,
        invitation_id=invitation_id,
        email=email,
    )

    if invitation is None:
        raise NotFoundError("Invitation not found.")

    _ensure_invitation_is_pending(invitation)
    _ensure_invitation_is_not_expired(invitation)

    existing_member = repository.get_organization_member_by_user_id(
        db,
        organization_id=invitation.organization_id,
        user_id=current_user.id,
    )

    if existing_member is not None:
        invitation.status = ORGANIZATION_INVITATION_STATUS_ACCEPTED
        db.commit()

        return {
            "id": existing_member.id,
            "organization_id": existing_member.organization_id,
            "user_id": existing_member.user_id,
            "role": existing_member.role,
            "email": current_user.email,
        }

    member = repository.create_organization_member(
        db,
        organization_id=invitation.organization_id,
        user_id=current_user.id,
        role=invitation.role,
    )

    invitation.status = ORGANIZATION_INVITATION_STATUS_ACCEPTED

    db.commit()
    db.refresh(member)

    return {
        "id": member.id,
        "organization_id": member.organization_id,
        "user_id": member.user_id,
        "role": member.role,
        "email": current_user.email,
    }


def decline_current_user_invitation(
    db: Session,
    *,
    invitation_id: int,
    current_user: User,
) -> OrganizationInvitation:
    email = _normalize_email(current_user.email)

    invitation = repository.get_organization_invitation_by_id_and_email(
        db,
        invitation_id=invitation_id,
        email=email,
    )

    if invitation is None:
        raise NotFoundError("Invitation not found.")

    _ensure_invitation_is_pending(invitation)
    _ensure_invitation_is_not_expired(invitation)

    invitation.status = ORGANIZATION_INVITATION_STATUS_DECLINED

    db.commit()
    db.refresh(invitation)

    return invitation
