# Workspaces

This document describes the workspace and organization foundation of the Fullstack Cloud Platform project.

The platform uses the terms **workspace** and **organization** closely together:

- **Organization** is the backend/domain name.
- **Workspace** is the user-facing product name in the frontend.

The current goal is to support SaaS-style collaboration where users can create workspaces, invite other users, manage workspace access, and work with workspace-scoped tasks.

## Current workspace model

```text
User
└── Organization / Workspace
    ├── Members
    ├── Invitations
    ├── Workspace tasks
    └── Settings
```

A user can create one or more workspaces.

A workspace has members. Each member has a role.

Current roles:

```text
owner
member
```

The workspace creator becomes the first owner.

## Backend feature

Workspace backend code lives under:

```text
services/backend/app/features/organizations/
```

Current files:

```text
models.py
permissions.py
repository.py
router.py
schemas.py
service.py
tasks_router.py
```

Responsibilities:

- `models.py` defines organization, membership, and invitation database models.
- `permissions.py` centralizes role and permission rules.
- `repository.py` contains organization-related database access.
- `router.py` exposes organization, member, invitation, ownership, leave, and settings APIs.
- `schemas.py` defines request and response contracts.
- `service.py` contains workspace business rules.
- `tasks_router.py` exposes workspace-scoped task routes.

## Frontend feature

Workspace frontend code lives under:

```text
apps/frontend/src/features/organizations/
```

Current responsibilities:

- workspace list and create UI
- workspace switcher integration
- workspace members panel
- invitation management
- invitation acceptance/decline UI
- workspace settings page
- workspace rename form
- organization API client calls
- organization hooks and state management

Application-level workspace routes live under:

```text
apps/frontend/src/app/routes/
```

Current workspace routes:

```text
/workspaces
/workspaces/:workspaceId/dashboard
/workspaces/:workspaceId/tasks
/workspaces/:workspaceId/members
/workspaces/:workspaceId/settings
```

## Invite-first membership policy

Workspace membership is intentionally **invite-first only**.

Owners invite users. Invited users accept or decline invitations.

Do not reintroduce direct/manual member creation APIs.

The following patterns must not be brought back:

```text
POST /organizations/{organization_id}/members
addOrganizationMember(...)
OrganizationMemberCreate
add_member_to_user_organization(...)
```

This keeps membership changes explicit, auditable, and closer to real SaaS behavior.

## Permission policy

Workspace permissions are centralized in:

```text
services/backend/app/features/organizations/permissions.py
```

Current rules:

```text
owner:
  - view members
  - invite members
  - cancel invitations
  - remove members
  - transfer ownership
  - manage workspace tasks
  - rename workspace

member:
  - view members
  - manage workspace tasks
  - leave workspace
```

Only owners can invite users, cancel invitations, transfer ownership, remove members, and rename a workspace.

Owners cannot leave a workspace until ownership is transferred.

Members can leave a workspace.

## Workspace settings

The workspace settings page is available at:

```text
/workspaces/:workspaceId/settings
```

Current settings capabilities:

- show workspace identity
- show current role
- provide quick links to tasks, members, and all workspaces
- explain access policy
- allow owners to rename a workspace
- show readonly rename note for members
- allow members to leave a workspace
- explain that owners must transfer ownership before leaving

## Workspace rename flow

Workspace rename is implemented as an owner-only setting.

Backend endpoint:

```text
PATCH /organizations/{organization_id}
```

Rules:

- unauthenticated users receive `401`
- owners can rename the workspace
- members receive `403`
- non-members receive `404`
- empty names receive validation errors

Frontend behavior:

- owners see an editable rename form
- members see a readonly note
- unchanged names keep the submit button disabled
- empty names show helper text
- successful rename updates workspace state so sidebar/header/settings show the new name

## Route-based workspace action consistency

Workspace route pages use the route workspace ID for route-specific actions.

For example, settings actions use:

```text
/workspaces/:workspaceId/settings
```

and call rename/leave actions with `routeWorkspace.id`.

This avoids relying only on global selected workspace state, which could become temporarily stale during navigation or workspace switching.

## Workspace task scope

Workspace task routes are protected by membership permissions.

Current direction:

```text
owners and members can manage workspace tasks
non-members cannot access workspace tasks
```

The permission rule is centralized through the organization permission helper instead of being duplicated in route handlers.

## Smoke coverage

The local smoke script validates workspace rename through both backend direct URL and frontend API proxy.

Script:

```text
scripts/local-smoke-test.sh
```

Covered flow:

```text
register user
login user
create task
create workspace
rename workspace
get renamed workspace
list workspaces after rename
repeat through frontend /api proxy
```

This keeps the local production-like preview safer when workspace settings change.

## Current limitations

The workspace foundation is intentionally still simple.

Current limitations:

- only `owner` and `member` roles exist
- only `member` invitations are supported
- no custom role matrix yet
- no audit log yet
- no workspace archive/delete policy yet
- no billing/subscription policy yet
- no invitation email delivery yet

These are future productization steps.

## Future direction

The next larger productization phase can add:

```text
audit logs
workspace activity history
workspace archive/delete policy
richer roles and permissions
billing/subscription placeholder
admin commands
stronger observability
```

Until then, the current workspace foundation should remain simple, explicit, and backend-enforced.
