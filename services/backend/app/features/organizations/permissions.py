ORGANIZATION_ROLE_OWNER = "owner"
ORGANIZATION_ROLE_MEMBER = "member"


def is_owner_role(role: str) -> bool:
    return role == ORGANIZATION_ROLE_OWNER


def is_member_role(role: str) -> bool:
    return role == ORGANIZATION_ROLE_MEMBER


def can_view_members(role: str) -> bool:
    return role in {ORGANIZATION_ROLE_OWNER, ORGANIZATION_ROLE_MEMBER}


def can_invite_members(role: str) -> bool:
    return is_owner_role(role)


def can_cancel_invitations(role: str) -> bool:
    return is_owner_role(role)


def can_remove_members(role: str) -> bool:
    return is_owner_role(role)


def can_transfer_ownership(role: str) -> bool:
    return is_owner_role(role)


def can_leave_workspace(role: str) -> bool:
    return is_member_role(role)


def can_manage_tasks(role: str) -> bool:
    return role in {ORGANIZATION_ROLE_OWNER, ORGANIZATION_ROLE_MEMBER}


def can_invite_role(role: str) -> bool:
    return is_member_role(role)
