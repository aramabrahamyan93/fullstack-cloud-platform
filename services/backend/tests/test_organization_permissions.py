from app.features.organizations.permissions import (
    ORGANIZATION_ROLE_MEMBER,
    ORGANIZATION_ROLE_OWNER,
    can_cancel_invitations,
    can_invite_members,
    can_invite_role,
    can_leave_workspace,
    can_manage_tasks,
    can_remove_members,
    can_transfer_ownership,
    can_view_members,
    is_member_role,
    is_owner_role,
)


def test_owner_role_helpers():
    assert is_owner_role(ORGANIZATION_ROLE_OWNER) is True
    assert is_owner_role(ORGANIZATION_ROLE_MEMBER) is False


def test_member_role_helpers():
    assert is_member_role(ORGANIZATION_ROLE_MEMBER) is True
    assert is_member_role(ORGANIZATION_ROLE_OWNER) is False


def test_owner_permissions():
    assert can_view_members(ORGANIZATION_ROLE_OWNER) is True
    assert can_invite_members(ORGANIZATION_ROLE_OWNER) is True
    assert can_cancel_invitations(ORGANIZATION_ROLE_OWNER) is True
    assert can_remove_members(ORGANIZATION_ROLE_OWNER) is True
    assert can_transfer_ownership(ORGANIZATION_ROLE_OWNER) is True
    assert can_manage_tasks(ORGANIZATION_ROLE_OWNER) is True
    assert can_leave_workspace(ORGANIZATION_ROLE_OWNER) is False


def test_member_permissions():
    assert can_view_members(ORGANIZATION_ROLE_MEMBER) is True
    assert can_invite_members(ORGANIZATION_ROLE_MEMBER) is False
    assert can_cancel_invitations(ORGANIZATION_ROLE_MEMBER) is False
    assert can_remove_members(ORGANIZATION_ROLE_MEMBER) is False
    assert can_transfer_ownership(ORGANIZATION_ROLE_MEMBER) is False
    assert can_manage_tasks(ORGANIZATION_ROLE_MEMBER) is True
    assert can_leave_workspace(ORGANIZATION_ROLE_MEMBER) is True


def test_unknown_role_has_no_permissions():
    role = "viewer"

    assert can_view_members(role) is False
    assert can_invite_members(role) is False
    assert can_cancel_invitations(role) is False
    assert can_remove_members(role) is False
    assert can_transfer_ownership(role) is False
    assert can_manage_tasks(role) is False
    assert can_leave_workspace(role) is False
    assert can_invite_role(role) is False


def test_only_member_role_can_be_invited_for_now():
    assert can_invite_role(ORGANIZATION_ROLE_MEMBER) is True
    assert can_invite_role(ORGANIZATION_ROLE_OWNER) is False
    assert can_invite_role("admin") is False
