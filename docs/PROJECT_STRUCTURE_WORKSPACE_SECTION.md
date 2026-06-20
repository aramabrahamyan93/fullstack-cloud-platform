# Project Structure — Workspace / Organization Section

This section can be used to update `docs/PROJECT_STRUCTURE.md`.

## Backend organization feature

Backend organization/workspace code lives under:

```text
services/backend/app/features/organizations/
```

Current structure:

```text
services/backend/app/features/organizations/
├── __init__.py
├── models.py
├── permissions.py
├── repository.py
├── router.py
├── schemas.py
├── service.py
└── tasks_router.py
```

Responsibilities:

- `models.py` — organization, membership, invitation, and audit log database models
- `permissions.py` — centralized owner/member permission helpers
- `repository.py` — database queries and persistence helpers
- `router.py` — organization, member, invitation, ownership, leave, rename, archive, restore, dashboard, and audit log APIs
- `schemas.py` — API request/response schemas
- `service.py` — business rules and permission-sensitive workflows
- `tasks_router.py` — workspace-scoped task routes

## Frontend organization feature

Frontend organization/workspace code lives under:

```text
apps/frontend/src/features/organizations/
```

Current structure:

```text
apps/frontend/src/features/organizations/
├── api.ts
├── components/
├── hooks/
└── types.ts
```

Current responsibilities:

- workspace API calls
- workspace list/create UI
- workspace settings UI
- workspace archive/restore UI
- workspace activity UI
- workspace dashboard UI
- workspace members UI
- invitation management UI
- current user invitation UI
- workspace hooks and state management

## Workspace application routes

Workspace application routes are defined in:

```text
apps/frontend/src/app/App.tsx
```

Current routes:

```text
/workspaces
/workspaces/:workspaceId/dashboard
/workspaces/:workspaceId/tasks
/workspaces/:workspaceId/members
/workspaces/:workspaceId/settings
/workspaces/:workspaceId/activity
```

Workspace navigation is defined in:

```text
apps/frontend/src/app/navigation.ts
apps/frontend/src/shared/components/Sidebar.tsx
```

The sidebar keeps the workspace-specific route type when switching workspace where possible.

Examples:

```text
/workspaces/ws_abc/tasks    -> /workspaces/ws_xyz/tasks
/workspaces/ws_abc/members  -> /workspaces/ws_xyz/members
/workspaces/ws_abc/settings -> /workspaces/ws_xyz/settings
/workspaces/ws_abc/activity -> /workspaces/ws_xyz/activity
```


## Workspace Public ID and Lifecycle Files

Backend files involved in workspace public IDs, archive, and restore:

```text
services/backend/app/core/public_ids.py
services/backend/app/features/organizations/models.py
services/backend/app/features/organizations/schemas.py
services/backend/app/features/organizations/repository.py
services/backend/app/features/organizations/service.py
services/backend/app/features/organizations/router.py
services/backend/app/features/organizations/tasks_router.py
services/backend/tests/test_organization_public_ids.py
services/backend/tests/test_organization_archive.py
services/backend/tests/test_organization_restore.py
services/backend/tests/test_organization_task_public_api_routes.py
```

Frontend files involved in workspace public routes and archive/restore UI:

```text
apps/frontend/src/features/organizations/api.ts
apps/frontend/src/features/organizations/hooks/useOrganizations.ts
apps/frontend/src/features/organizations/types.ts
apps/frontend/src/features/organizations/components/WorkspaceSettingsPage.tsx
apps/frontend/src/features/organizations/components/WorkspaceSettingsPage.css
apps/frontend/src/features/organizations/components/WorkspaceActivityPage.tsx
apps/frontend/src/app/routes/WorkspaceSettingsRoute.tsx
apps/frontend/src/app/hooks/useWorkspaceController.ts
apps/frontend/src/app/routes/useWorkspaceRouteContext.ts
apps/frontend/src/shared/api/errors.ts
```

## Audit Log Files

Backend files involved in workspace audit logging:

```text
services/backend/app/features/organizations/models.py
services/backend/app/features/organizations/schemas.py
services/backend/app/features/organizations/repository.py
services/backend/app/features/organizations/service.py
services/backend/app/features/organizations/router.py
services/backend/app/db/init_db.py
services/backend/tests/test_organization_audit_logs.py
services/backend/tests/test_organization_archive.py
services/backend/tests/test_organization_restore.py
```

Frontend files involved in workspace activity page:

```text
apps/frontend/src/features/organizations/types.ts
apps/frontend/src/features/organizations/api.ts
apps/frontend/src/features/organizations/hooks/useOrganizationAuditLogs.ts
apps/frontend/src/features/organizations/components/WorkspaceActivityPage.tsx
apps/frontend/src/features/organizations/components/WorkspaceActivityPage.css
apps/frontend/src/app/routes/WorkspaceActivityRoute.tsx
apps/frontend/src/app/hooks/useWorkspaceController.ts
apps/frontend/src/app/App.tsx
apps/frontend/src/app/navigation.ts
apps/frontend/src/shared/components/Sidebar.tsx
```

Smoke coverage:

```text
scripts/local-smoke-test.sh
```
