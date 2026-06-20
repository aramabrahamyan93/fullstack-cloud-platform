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
    ├── Activity / Audit logs
    └── Settings
```

A user can create one or more workspaces.

A workspace has both:

```text
id        -> internal numeric database identifier
public_id -> non-guessable public route/API identifier, for example ws_8fK2xQm91aP
```

Browser routes and frontend API calls should use `public_id`. Backend services and database joins can still use the internal numeric `id`.

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

- `models.py` defines organization, membership, invitation, and audit log database models.
- `permissions.py` centralizes role and permission rules.
- `repository.py` contains organization-related database access.
- `router.py` exposes organization, member, invitation, ownership, leave, settings, archive, restore, dashboard, and audit log APIs.
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
- workspace archive and restore actions
- workspace activity page
- workspace dashboard summary
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
  - archive workspace
  - restore workspace

member:
  - view members
  - manage workspace tasks
  - leave workspace
```

Only owners can invite users, cancel invitations, transfer ownership, remove members, and rename a workspace.

Owners cannot leave a workspace until ownership is transferred.

Members can leave a workspace.

Archived workspace policy:

```text
owner/member -> can read workspace data
owner        -> can restore workspace
all members  -> cannot write workspace tasks while archived
owner        -> cannot rename/invite while archived
```

Archived write attempts return the stable backend error code `workspace_archived`.

## Workspace settings

The workspace settings page is available at:

```text
/workspaces/:workspaceId/settings
/workspaces/:workspaceId/activity
```

Current settings capabilities:

- show workspace identity
- show current role
- provide quick links to tasks, members, and all workspaces
- explain access policy
- allow owners to rename a workspace
- allow owners to archive an active workspace
- allow owners to restore an archived workspace
- allow owners to soft-delete an archived workspace
- show workspace status
- show readonly rename note for members
- allow members to leave a workspace
- explain that owners must transfer ownership before leaving

## Workspace lifecycle: active, archived, restored, deleted

Workspaces currently support a simple lifecycle:

```text
active -> archived -> active
active -> archived -> deleted
```

The `status` field is returned by workspace API responses:

```text
active
archived
deleted
```

### Archive flow

Archive is an owner-only action.

Backend endpoint:

```text
POST /organizations/{organization_id_or_public_id}/archive
```

Archive behavior:

- unauthenticated users receive `401`
- owners can archive the workspace
- members receive `403` with `workspace_owner_required`
- non-members receive `404`
- archiving an already archived workspace is idempotent
- archive writes an audit event `workspace_archived`
- existing data remains readable
- workspace task writes are blocked
- workspace rename is blocked
- workspace invitations are blocked

Blocked archived workspace writes return:

```text
workspace_archived
```

### Restore flow

Restore is an owner-only action.

Backend endpoint:

```text
POST /organizations/{organization_id_or_public_id}/restore
```

Restore behavior:

- unauthenticated users receive `401`
- owners can restore the workspace
- members receive `403` with `workspace_owner_required`
- non-members receive `404`
- restoring an already active workspace is idempotent
- restore writes an audit event `workspace_restored` only when status changes from archived to active
- rename, invitations, and workspace task writes become available again

Frontend behavior:

- Settings shows workspace status
- Settings shows Archive action for active workspaces
- Settings shows Restore action for archived workspaces
- archived workspace task UI becomes read-only
- restored workspaces become editable again through the existing task/member/settings flows

### Soft delete flow

Soft delete is an owner-only action for archived workspaces. It is not hard delete.

Backend endpoint:

```text
DELETE /organizations/{organization_id_or_public_id}
```

Delete behavior:

- unauthenticated users receive `401`
- owners can soft-delete an archived workspace
- members receive `403` with `workspace_owner_required`
- non-members receive `404`
- active workspaces cannot be deleted directly
- active workspace delete attempts return `workspace_delete_requires_archive`
- deleted workspaces are hidden from normal workspace list/get/public_id routes
- deleted workspaces cannot be restored through normal user-facing restore routes in the current MVP
- hard delete is intentionally not implemented yet

Soft delete writes the audit event:

```text
workspace_deleted
```

Current soft-delete metadata:

```text
previous_status
new_status
```

Frontend behavior:

- Settings shows Delete action for archived workspaces
- active workspaces show an Archive-before-delete state
- successful delete removes the workspace from normal workspace state
- successful delete navigates back to `/workspaces`


## Workspace rename flow

Workspace rename is implemented as an owner-only setting.

Backend endpoint:

```text
PATCH /organizations/{organization_id_or_public_id}
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
/workspaces/:workspaceId/activity
```

and call rename/leave actions with `routeWorkspace.id`.

This avoids relying only on global selected workspace state, which could become temporarily stale during navigation or workspace switching.

## Workspace task scope

Workspace task routes are protected by membership permissions.

Current direction:

```text
active workspace:
  owners and members can manage workspace tasks
  non-members cannot access workspace tasks

archived workspace:
  owners and members can read workspace tasks
  task create/update/delete is blocked
```

The permission rule is centralized through the organization permission helper instead of being duplicated in route handlers.

## Smoke coverage

The local smoke script validates workspace public ID routes through both backend direct URL and frontend API proxy.

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
extract workspace public_id
rename workspace through public_id route
get renamed workspace through public_id route
list workspaces after rename
verify workspace audit logs
verify workspace dashboard summary
repeat through frontend /api proxy
```

This keeps the local production-like preview safer when workspace settings change.

## Current limitations

The workspace foundation is intentionally still simple.

Current limitations:

- only `owner` and `member` roles exist
- only `member` invitations are supported
- no custom role matrix yet
- hard delete and retention policy are intentionally not implemented yet
- no billing/subscription policy yet
- no invitation email delivery yet

These are future productization steps.

## Future direction

The next larger productization phase can add:

```text
hard delete, retention, or admin recovery policy
audit log filters and pagination
richer roles and permissions
billing/subscription placeholder
admin commands
stronger observability
```

Until then, the current workspace foundation should remain simple, explicit, and backend-enforced.


## Workspace Audit Logs

The workspace audit log is a read-only activity history for important workspace actions.

Backend endpoint:

```text
GET /organizations/{organization_id}/audit-logs
```

Access policy:

- authenticated workspace owners can view audit logs
- authenticated workspace members can view audit logs
- non-members receive `404 Not Found`
- unauthenticated users receive `401 Unauthorized`

The endpoint returns the latest events first.

Current audit event types:

```text
workspace_created
workspace_renamed
workspace_archived
workspace_restored
workspace_deleted
member_invited
invitation_accepted
invitation_declined
invitation_cancelled
member_removed
ownership_transferred
workspace_left
```

Each audit log item includes:

```text
id
organization_id
actor_user_id
event_type
metadata_json
created_at
```

### Event metadata

Audit metadata is intentionally stored as flexible JSON so each event can carry only the fields that are useful for that action.

Examples:

```text
workspace_created:
  name

workspace_renamed:
  previous_name
  new_name

workspace_archived:
  previous_status
  new_status

workspace_restored:
  previous_status
  new_status

workspace_deleted:
  previous_status
  new_status

member_invited:
  invitation_id
  email
  role

invitation_accepted:
  invitation_id
  member_id
  user_id
  email
  role

invitation_declined:
  invitation_id
  email
  role

invitation_cancelled:
  invitation_id
  email
  role

member_removed:
  member_id
  user_id
  role

ownership_transferred:
  previous_owner_member_id
  previous_owner_user_id
  new_owner_member_id
  new_owner_user_id

workspace_left:
  member_id
  user_id
  role
```

### Frontend Activity Page

The frontend exposes workspace audit logs as a read-only activity page:

```text
/workspaces/:workspaceId/activity
```

The Activity page is reachable from the Workspace navigation sidebar and displays:

- human-readable event label
- raw event code
- actor user id
- audit log id
- event date/time
- metadata fields

### Smoke Coverage

`scripts/local-smoke-test.sh` verifies that workspace create/rename actions produce audit log records and that public ID routes work through both backend direct URLs and the frontend API proxy.

The smoke test checks both:

```text
http://localhost:8000/organizations/{workspace_public_id}/audit-logs
http://localhost:3000/api/organizations/{workspace_public_id}/audit-logs
```

Expected smoke events:

```text
workspace_created
workspace_renamed
```

The smoke coverage is intentionally focused on production-like routing. Full lifecycle coverage for invitations, member removal, ownership transfer, workspace leave, archive, and restore actions is handled by backend tests.

Additional manual/final validation has also checked frontend proxy archive/restore behavior:

```text
create workspace -> active
archive workspace -> archived
restore workspace -> active
audit logs include workspace_archived and workspace_restored
```


Additional local smoke validation for soft delete confirms:

```text
action: create workspace -> archive workspace -> delete workspace
active delete: 403 workspace_delete_requires_archive
archived delete: 204
get deleted workspace: 404
deleted workspace list visibility: hidden
```
