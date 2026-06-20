# Architecture — Workspace / Organization Section

This section can be appended to `docs/ARCHITECTURE.md`.

## Workspace and organization architecture

The platform now has a workspace/organization foundation as part of the SaaS-ready modular monolith.

The backend/domain term is **organization**. The frontend/product term is **workspace**.

Workspace-related backend code lives in:

```text
services/backend/app/features/organizations/
```

This feature owns organization models, schemas, repository logic, service rules, permission helpers, routers, audit logging, lifecycle policy, and workspace-scoped task routes.

The current organization feature includes:

```text
models.py
permissions.py
repository.py
router.py
schemas.py
service.py
tasks_router.py
```

The important architecture rule is that workspace security and permissions are backend-enforced.

Frontend role checks can improve UX, but they are not the source of truth.

## Workspace public ID architecture

The backend keeps numeric organization IDs as internal database identifiers.

The API and browser routes support public workspace IDs so the frontend does not need to expose numeric IDs in URLs.

Current pattern:

```text
public route/API input -> organization.public_id, for example ws_8fK2xQm91aP
backend resolution     -> numeric organization.id
database joins         -> numeric organization.id
API response           -> includes both id and public_id
```

Frontend routes should use public IDs:

```text
/workspaces/ws_8fK2xQm91aP/dashboard
/workspaces/ws_8fK2xQm91aP/tasks
/workspaces/ws_8fK2xQm91aP/members
/workspaces/ws_8fK2xQm91aP/settings
/workspaces/ws_8fK2xQm91aP/activity
```

Backend service logic should resolve public IDs at the API boundary and continue using numeric IDs internally where appropriate.

## Workspace permission policy

Workspace role and permission checks are centralized in:

```text
services/backend/app/features/organizations/permissions.py
```

Current roles:

```text
owner
member
```

Current direction:

```text
owners can manage workspace access and settings
owners can archive, restore, and soft-delete workspaces
owners and members can manage workspace tasks while the workspace is active
owners and members can read archived workspaces
members can leave workspaces
owners must transfer ownership before leaving
```

Permission logic should not be duplicated inside route handlers.

Route handlers should delegate permission-sensitive workflows to service functions and permission helpers.

## Invite-first membership

Workspace membership is invite-first only.

Owners invite users. Users accept or decline invitations.

Direct/manual member creation endpoints should not be reintroduced.

Do not bring back:

```text
POST /organizations/{organization_id}/members
addOrganizationMember(...)
OrganizationMemberCreate
add_member_to_user_organization(...)
```

This keeps membership changes explicit and prepares the platform for future audit logs and invitation email delivery.

## Workspace settings

Workspace settings are available in the frontend at:

```text
/workspaces/:workspaceId/settings
```

Current settings include role-aware UI, workspace identity, workspace status, access policy information, member leave action, owner leave restriction note, owner-only workspace rename, owner-only archive, owner-only restore, and owner-only soft delete.

Workspace rename is exposed through:

```text
PATCH /organizations/{organization_id_or_public_id}
```

The backend enforces that only owners can rename a workspace.

## Workspace lifecycle architecture

Workspace lifecycle is currently status-based.

Current statuses:

```text
active
archived
```

Current lifecycle:

```text
active -> archived -> active
active -> archived -> deleted
```

Archive endpoint:

```text
POST /organizations/{organization_id_or_public_id}/archive
```

Restore endpoint:

```text
POST /organizations/{organization_id_or_public_id}/restore
```

Architecture rules:

- lifecycle transitions are backend-enforced
- only owners can archive, restore, or soft-delete
- non-members receive `404` so they cannot infer workspace existence
- archived workspaces remain readable
- archived workspace writes are blocked with the stable error code `workspace_archived`
- restore is idempotent if the workspace is already active
- archive/restore/delete events are recorded through the audit log foundation
- frontend read-only state is UX only; backend remains the source of truth

Blocked archived workspace operations currently include:

```text
workspace rename
workspace invitations
workspace task create
workspace task update
workspace task delete
```


### Soft delete architecture

Soft delete extends the workspace lifecycle without hard database deletion.

Status values:

```text
active
archived
deleted
```

Normal user-facing workspace queries exclude deleted workspaces:

```text
Organization.status != "deleted"
```

The delete endpoint is:

```text
DELETE /organizations/{organization_id_or_public_id}
```

Delete rules:

- only workspace owners can soft-delete
- only archived workspaces can be soft-deleted
- active workspace delete attempts return `workspace_delete_requires_archive`
- deleted workspaces are hidden from normal workspace list/get/public_id routes
- deleted workspaces cannot be restored through the current user-facing restore endpoint
- hard delete, retention, and admin recovery are intentionally separate future policies

Soft delete records:

```text
workspace_deleted
```

## Route-based workspace consistency

Workspace route pages should use the route workspace ID for route-specific actions.

For example, settings actions should operate on `routeWorkspace.id` from:

```text
/workspaces/:workspaceId/settings
```

This avoids coupling route actions only to global selected workspace state.

The global selected workspace is still useful for sidebar navigation and default workspace context, but route-specific actions should be grounded in the route context when available.


## Workspace Audit Log Architecture

Workspace audit logging is implemented inside the organizations feature because audit events are scoped to a workspace.

The audit log is intentionally read-only from the API consumer perspective. Events are written by backend service methods as part of existing domain actions.

Design rules:

- the backend is the source of truth for audit events
- frontend only reads and displays activity
- audit log writes happen in the same service flow as the business action
- non-members should not be able to infer workspace existence
- event names are stable API/domain contracts
- metadata is flexible JSON to avoid schema churn for small event-specific details

Current backend layers:

```text
router -> service -> repository -> model
```

Current model:

```text
OrganizationAuditLog
```

Current endpoint:

```text
GET /organizations/{organization_id_or_public_id}/audit-logs
```

Visibility rule:

```text
workspace owner/member -> 200
non-member              -> 404
unauthenticated         -> 401
```

Current lifecycle-related audit events include:

```text
workspace_archived
workspace_restored
workspace_deleted
```

Current metadata examples:

```text
workspace_archived:
  previous_status
  new_status

workspace_restored:
  previous_status
  new_status

workspace_deleted:
  previous_status
  new_status
```

The audit log is not currently paginated beyond a repository-level limit. Future improvements can add cursor pagination, filters by event type, actor, or date range.
