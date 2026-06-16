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

- `models.py` — organization, membership, and invitation database models
- `permissions.py` — centralized owner/member permission helpers
- `repository.py` — database queries and persistence helpers
- `router.py` — organization, member, invitation, ownership, leave, and rename APIs
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
```

Workspace navigation is defined in:

```text
apps/frontend/src/app/navigation.ts
apps/frontend/src/shared/components/Sidebar.tsx
```

The sidebar keeps the workspace-specific route type when switching workspace where possible.

Examples:

```text
/workspaces/1/tasks    -> /workspaces/2/tasks
/workspaces/1/members  -> /workspaces/2/members
/workspaces/1/settings -> /workspaces/2/settings
```
