from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.db.dependencies import get_current_user, get_db
from app.features.organizations.schemas import OrganizationCreate
from app.features.organizations.schemas import OrganizationInvitationCreate
from app.features.organizations.schemas import OrganizationInvitationRead
from app.features.organizations.schemas import OrganizationInviteCandidateRead
from app.features.organizations.schemas import OrganizationMemberCreate
from app.features.organizations.schemas import OrganizationMemberRead
from app.features.organizations.schemas import MyOrganizationInvitationRead
from app.features.organizations.schemas import OrganizationRead
from app.features.organizations.service import (
    accept_current_user_invitation,
    add_member_to_user_organization,
    cancel_user_organization_invitation,
    create_user_organization_invitation,
    decline_current_user_invitation,
    create_user_organization,
    get_organization_for_user,
    list_current_user_pending_invitations,
    list_user_organization_invite_candidates,
    list_members_for_user_organization,
    list_user_organization_invitations,
    leave_user_organization,
    list_organizations_for_user,
    remove_member_from_user_organization,
    transfer_user_organization_ownership,
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

@router.get("/{organization_id}/members", response_model=list[OrganizationMemberRead])
def list_organization_members(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OrganizationMemberRead]:
    return list_members_for_user_organization(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

@router.post(
    "/{organization_id}/members",
    response_model=OrganizationMemberRead,
    status_code=201,
)
def add_organization_member(
    organization_id: int,
    member_create: OrganizationMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationMemberRead:
    return add_member_to_user_organization(
        db,
        organization_id=organization_id,
        current_user=current_user,
        member_create=member_create,
    )



@router.post(
    "/{organization_id}/invitations",
    response_model=OrganizationInvitationRead,
    status_code=201,
)
def create_organization_invitation(
    organization_id: int,
    invitation_create: OrganizationInvitationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationInvitationRead:
    return create_user_organization_invitation(
        db,
        organization_id=organization_id,
        current_user=current_user,
        invitation_create=invitation_create,
    )


@router.get(
    "/{organization_id}/invitations",
    response_model=list[OrganizationInvitationRead],
)
def list_organization_invitations(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OrganizationInvitationRead]:
    return list_user_organization_invitations(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )


@router.delete(
    "/{organization_id}/invitations/{invitation_id}",
    status_code=204,
)
def cancel_organization_invitation(
    organization_id: int,
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    cancel_user_organization_invitation(
        db,
        organization_id=organization_id,
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
    organization_id: int,
    query: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OrganizationInviteCandidateRead]:
    return list_user_organization_invite_candidates(
        db,
        organization_id=organization_id,
        current_user=current_user,
        query=query,
    )


@router.delete(
    "/{organization_id}/members/{member_id}",
    status_code=204,
)
def remove_organization_member(
    organization_id: int,
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    remove_member_from_user_organization(
        db,
        organization_id=organization_id,
        member_id=member_id,
        current_user=current_user,
    )

    return Response(status_code=204)


@router.post(
    "/{organization_id}/members/{member_id}/transfer-ownership",
    status_code=204,
)
def transfer_organization_ownership(
    organization_id: int,
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    transfer_user_organization_ownership(
        db,
        organization_id=organization_id,
        member_id=member_id,
        current_user=current_user,
    )

    return Response(status_code=204)


@router.delete(
    "/{organization_id}/membership",
    status_code=204,
)
def leave_organization(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    leave_user_organization(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

    return Response(status_code=204)
