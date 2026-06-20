from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.db.dependencies import get_current_user, get_db
from app.features.organizations.schemas import OrganizationAuditLogRead
from app.features.organizations.schemas import OrganizationCreate
from app.features.organizations.schemas import OrganizationDashboardRead
from app.features.organizations.schemas import OrganizationInvitationCreate
from app.features.organizations.schemas import OrganizationInvitationRead
from app.features.organizations.schemas import OrganizationInviteCandidateRead
from app.features.organizations.schemas import OrganizationMemberRead
from app.features.organizations.schemas import MyOrganizationInvitationRead
from app.features.organizations.schemas import OrganizationRead
from app.features.organizations.schemas import OrganizationUpdate
from app.features.organizations.service import (
    accept_current_user_invitation,
    archive_user_organization,
    cancel_user_organization_invitation,
    create_user_organization_invitation,
    decline_current_user_invitation,
    create_user_organization,
    delete_user_organization,
    get_organization_for_user,
    resolve_organization_for_user,
    get_user_organization_dashboard,
    list_current_user_pending_invitations,
    list_user_organization_invite_candidates,
    list_members_for_user_organization,
    list_user_organization_audit_logs,
    list_user_organization_invitations,
    leave_user_organization,
    list_organizations_for_user,
    update_user_organization,
    remove_member_from_user_organization,
    restore_user_organization,
    transfer_user_organization_ownership,
)
from app.features.users.models import User

router = APIRouter(prefix="/organizations", tags=["organizations"])



def resolve_organization_id(
    db: Session,
    *,
    organization_ref: str,
    current_user: User,
) -> int:
    organization = resolve_organization_for_user(
        db,
        organization_ref=organization_ref,
        current_user=current_user,
    )

    return organization.id



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
    organization_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationRead:
    organization = resolve_organization_for_user(
        db,
        organization_ref=organization_id,
        current_user=current_user,
    )

    return organization


@router.get(
    "/{organization_id}/dashboard",
    response_model=OrganizationDashboardRead,
)
def get_organization_dashboard(
    organization_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationDashboardRead:
    resolved_organization_id = resolve_organization_id(
        db,
        organization_ref=organization_id,
        current_user=current_user,
    )

    return get_user_organization_dashboard(
        db,
        organization_id=resolved_organization_id,
        current_user=current_user,
    )

@router.get("/{organization_id}/members", response_model=list[OrganizationMemberRead])
def list_organization_members(
    organization_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OrganizationMemberRead]:
    resolved_organization_id = resolve_organization_id(
        db,
        organization_ref=organization_id,
        current_user=current_user,
    )

    return list_members_for_user_organization(
        db,
        organization_id=resolved_organization_id,
        current_user=current_user,
    )


@router.post(
    "/{organization_id}/invitations",
    response_model=OrganizationInvitationRead,
    status_code=201,
)
def create_organization_invitation(
    organization_id: str,
    invitation_create: OrganizationInvitationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationInvitationRead:
    resolved_organization_id = resolve_organization_id(
        db,
        organization_ref=organization_id,
        current_user=current_user,
    )

    return create_user_organization_invitation(
        db,
        organization_id=resolved_organization_id,
        current_user=current_user,
        invitation_create=invitation_create,
    )


@router.get(
    "/{organization_id}/invitations",
    response_model=list[OrganizationInvitationRead],
)
def list_organization_invitations(
    organization_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OrganizationInvitationRead]:
    resolved_organization_id = resolve_organization_id(
        db,
        organization_ref=organization_id,
        current_user=current_user,
    )

    return list_user_organization_invitations(
        db,
        organization_id=resolved_organization_id,
        current_user=current_user,
    )


@router.delete(
    "/{organization_id}/invitations/{invitation_id}",
    status_code=204,
)
def cancel_organization_invitation(
    organization_id: str,
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    resolved_organization_id = resolve_organization_id(
        db,
        organization_ref=organization_id,
        current_user=current_user,
    )

    cancel_user_organization_invitation(
        db,
        organization_id=resolved_organization_id,
        invitation_id=invitation_id,
        current_user=current_user,
    )

    return Response(status_code=204)


@router.get(
    "/invitations/me",
    response_model=list[MyOrganizationInvitationRead],
)
def list_my_organization_invitations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MyOrganizationInvitationRead]:
    return list_current_user_pending_invitations(
        db,
        current_user=current_user,
    )


@router.post(
    "/invitations/{invitation_id}/accept",
    response_model=OrganizationMemberRead,
)
def accept_my_organization_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationMemberRead:
    return accept_current_user_invitation(
        db,
        invitation_id=invitation_id,
        current_user=current_user,
    )


@router.post(
    "/invitations/{invitation_id}/decline",
    response_model=OrganizationInvitationRead,
)
def decline_my_organization_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationInvitationRead:
    return decline_current_user_invitation(
        db,
        invitation_id=invitation_id,
        current_user=current_user,
    )


@router.get(
    "/{organization_id}/invite-candidates",
    response_model=list[OrganizationInviteCandidateRead],
)
def list_organization_invite_candidates(
    organization_id: str,
    query: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OrganizationInviteCandidateRead]:
    resolved_organization_id = resolve_organization_id(
        db,
        organization_ref=organization_id,
        current_user=current_user,
    )

    return list_user_organization_invite_candidates(
        db,
        organization_id=resolved_organization_id,
        current_user=current_user,
        query=query,
    )


@router.delete(
    "/{organization_id}/members/{member_id}",
    status_code=204,
)
def remove_organization_member(
    organization_id: str,
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    resolved_organization_id = resolve_organization_id(
        db,
        organization_ref=organization_id,
        current_user=current_user,
    )

    remove_member_from_user_organization(
        db,
        organization_id=resolved_organization_id,
        member_id=member_id,
        current_user=current_user,
    )

    return Response(status_code=204)


@router.post(
    "/{organization_id}/members/{member_id}/transfer-ownership",
    status_code=204,
)
def transfer_organization_ownership(
    organization_id: str,
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    resolved_organization_id = resolve_organization_id(
        db,
        organization_ref=organization_id,
        current_user=current_user,
    )

    transfer_user_organization_ownership(
        db,
        organization_id=resolved_organization_id,
        member_id=member_id,
        current_user=current_user,
    )

    return Response(status_code=204)


@router.delete(
    "/{organization_id}/membership",
    status_code=204,
)
def leave_organization(
    organization_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    resolved_organization_id = resolve_organization_id(
        db,
        organization_ref=organization_id,
        current_user=current_user,
    )

    leave_user_organization(
        db,
        organization_id=resolved_organization_id,
        current_user=current_user,
    )

    return Response(status_code=204)


@router.get(
    "/{organization_id}/audit-logs",
    response_model=list[OrganizationAuditLogRead],
)
def list_organization_audit_logs(
    organization_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OrganizationAuditLogRead]:
    resolved_organization_id = resolve_organization_id(
        db,
        organization_ref=organization_id,
        current_user=current_user,
    )

    return list_user_organization_audit_logs(
        db,
        organization_id=resolved_organization_id,
        current_user=current_user,
    )


@router.patch("/{organization_id}", response_model=OrganizationRead)
def update_organization(
    organization_id: str,
    organization_update: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_organization_id = resolve_organization_id(
        db,
        organization_ref=organization_id,
        current_user=current_user,
    )

    return update_user_organization(
        db,
        organization_id=resolved_organization_id,
        current_user=current_user,
        organization_update=organization_update,
    )

@router.post("/{organization_id}/archive", response_model=OrganizationRead)
def archive_organization(
    organization_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationRead:
    resolved_organization_id = resolve_organization_id(
        db,
        organization_ref=organization_id,
        current_user=current_user,
    )

    return archive_user_organization(
        db,
        organization_id=resolved_organization_id,
        current_user=current_user,
    )


@router.post("/{organization_id}/restore", response_model=OrganizationRead)
def restore_organization(
    organization_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationRead:
    resolved_organization_id = resolve_organization_id(
        db,
        organization_ref=organization_id,
        current_user=current_user,
    )

    return restore_user_organization(
        db,
        organization_id=resolved_organization_id,
        current_user=current_user,
    )



@router.delete("/{organization_id}", status_code=204)
def delete_organization(
    organization_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    resolved_organization_id = resolve_organization_id(
        db,
        organization_ref=organization_id,
        current_user=current_user,
    )

    delete_user_organization(
        db,
        organization_id=resolved_organization_id,
        current_user=current_user,
    )

    return Response(status_code=204)
