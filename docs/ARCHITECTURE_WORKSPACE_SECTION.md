# Architecture — Workspace / Organization Section

This section can be appended to `docs/ARCHITECTURE.md`.

## Workspace and organization architecture

The platform now has a workspace/organization foundation as part of the SaaS-ready modular monolith.

The backend/domain term is **organization**. The frontend/product term is **workspace**.

Workspace-related backend code lives in:

```text
services/backend/app/features/organizations/
```

This feature owns organization models, schemas, repository logic, service rules, permission helpers, routers, and workspace-scoped task routes.

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
owners and members can manage workspace tasks
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

Current settings include role-aware UI, workspace identity, access policy information, member leave action, owner leave restriction note, and owner-only workspace rename.

Workspace rename is exposed through:

```text
PATCH /organizations/{organization_id}
```

The backend enforces that only owners can rename a workspace.

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
GET /organizations/{organization_id}/audit-logs
```

Visibility rule:

```text
workspace owner/member -> 200
non-member              -> 404
unauthenticated         -> 401
```

The audit log is not currently paginated beyond a repository-level limit. Future improvements can add cursor pagination, filters by event type, actor, or date range.
