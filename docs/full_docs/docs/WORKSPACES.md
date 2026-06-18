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
    ├── Dashboard
    ├── Activity
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

## Workspace public ID policy

Workspaces have both an internal numeric database ID and a public ID.

Example public ID:

```text
ws_8fK2xQm91aP
```

Policy:

- numeric IDs remain internal database identifiers
- public URLs should use `public_id`
- frontend workspace routes use `public_id`
- frontend workspace API calls should prefer `public_id`
- backend route parameters still use the historical name `{organization_id}`, but they accept both legacy numeric IDs and public IDs
- new user-facing docs and examples should show public IDs, not numeric database IDs

Current public workspace API examples:

```text
GET    /organizations/ws_8fK2xQm91aP
PATCH  /organizations/ws_8fK2xQm91aP
GET    /organizations/ws_8fK2xQm91aP/dashboard
GET    /organizations/ws_8fK2xQm91aP/audit-logs
GET    /organizations/ws_8fK2xQm91aP/members
GET    /organizations/ws_8fK2xQm91aP/invitations
POST   /organizations/ws_8fK2xQm91aP/invitations
GET    /organizations/ws_8fK2xQm91aP/invite-candidates
DELETE /organizations/ws_8fK2xQm91aP/members/{member_id}
POST   /organizations/ws_8fK2xQm91aP/members/{member_id}/transfer-ownership
DELETE /organizations/ws_8fK2xQm91aP/membership
GET    /organizations/ws_8fK2xQm91aP/tasks
POST   /organizations/ws_8fK2xQm91aP/tasks
GET    /organizations/ws_8fK2xQm91aP/tasks/paginated
GET    /organizations/ws_8fK2xQm91aP/tasks/stats
GET    /organizations/ws_8fK2xQm91aP/tasks/{task_id}
PUT    /organizations/ws_8fK2xQm91aP/tasks/{task_id}
DELETE /organizations/ws_8fK2xQm91aP/tasks/{task_id}
```


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

- `models.py` defines organization, membership, invitation, and audit log database models.
- `permissions.py` centralizes role and permission rules.
- `repository.py` contains organization-related database access.
- `router.py` exposes organization, dashboard, audit log, member, invitation, ownership, leave, and settings APIs.
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
- workspace dashboard summary
- workspace members panel
- invitation management
- invitation acceptance/decline UI
- workspace activity page
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
/workspaces/:workspaceId/activity
```

`workspaceId` is the workspace public ID, for example:

```text
/workspaces/ws_8fK2xQm91aP/dashboard
/workspaces/ws_8fK2xQm91aP/tasks
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

The `{organization_id}` path parameter is a compatibility name. Public clients should pass the workspace `public_id`, for example:

```text
PATCH /organizations/ws_8fK2xQm91aP
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

where `workspaceId` is the workspace public ID. Internally, the frontend can still use numeric IDs for in-memory selection, but API calls should prefer `public_id`.

This avoids relying only on global selected workspace state, which could become temporarily stale during navigation or workspace switching.

## Workspace task scope

Workspace task routes are protected by membership permissions.

Current direction:

```text
owners and members can manage workspace tasks
non-members cannot access workspace tasks
```

The permission rule is centralized through the organization permission helper instead of being duplicated in route handlers.

## Workspace audit log

Workspace audit logging is available through:

```text
GET /organizations/{organization_id}/audit-logs
```

Public clients should pass a workspace public ID:

```text
GET /organizations/ws_8fK2xQm91aP/audit-logs
```

Current audit events:

```text
workspace_created
workspace_renamed
member_invited
invitation_accepted
invitation_declined
invitation_cancelled
member_removed
ownership_transferred
workspace_left
```

## Smoke coverage

The local smoke script validates workspace rename, workspace audit logs, and workspace dashboard summary through both backend direct URL and frontend API proxy.

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
read workspace audit logs
read workspace dashboard summary
repeat through frontend /api proxy
```

This keeps the local production-like preview safer when workspace settings change.

## Current limitations

The workspace foundation is intentionally still simple.

Current limitations:

- only `owner` and `member` roles exist
- only `member` invitations are supported
- no custom role matrix yet
- audit log is available but still intentionally simple
- no workspace archive/delete policy yet
