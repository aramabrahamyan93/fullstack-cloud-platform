# Workspace Dashboard Stats

## Purpose

Workspace Dashboard Stats adds a compact, product-style summary for each workspace dashboard. The goal is to give the user a quick overview of workload, team size, pending invitations, and recent workspace activity without opening multiple workspace pages.

## Backend Endpoint

```text
GET /organizations/{organization_id}/dashboard
```

## Response Shape

```json
{
  "organization_id": 1,
  "task_counts": {
    "all": 3,
    "open": 1,
    "in_progress": 1,
    "done": 1
  },
  "members_count": 2,
  "pending_invitations_count": 1,
  "recent_activity_count": 5
}
```

## Included Metrics

- `task_counts.all` — total workspace tasks
- `task_counts.open` — open workspace tasks
- `task_counts.in_progress` — workspace tasks currently in progress
- `task_counts.done` — completed workspace tasks
- `members_count` — active workspace members
- `pending_invitations_count` — pending workspace invitations
- `recent_activity_count` — number of workspace audit log records counted for dashboard summary

## Access Control

The dashboard summary follows the existing workspace membership access rule:

- workspace owners can view the dashboard summary
- workspace members can view the dashboard summary
- non-members receive `404 not_found`

The backend remains the source of truth for workspace access and security rules.

## Backend Implementation Summary

Implemented files:

```text
services/backend/app/features/organizations/router.py
services/backend/app/features/organizations/service.py
services/backend/app/features/organizations/repository.py
services/backend/app/features/organizations/schemas.py
services/backend/tests/test_organization_dashboard.py
```

Main backend additions:

- `OrganizationTaskCountsRead`
- `OrganizationDashboardRead`
- `get_user_organization_dashboard(...)`
- repository counters for members, invitations, and audit logs
- route: `GET /organizations/{organization_id}/dashboard`
- tests for owner access, member access, and non-member denial

## Frontend Implementation Summary

Implemented files:

```text
apps/frontend/src/features/organizations/types.ts
apps/frontend/src/features/organizations/api.ts
apps/frontend/src/features/organizations/hooks/useOrganizationDashboardSummary.ts
apps/frontend/src/app/hooks/useWorkspaceController.ts
apps/frontend/src/app/routes/WorkspaceDashboardRoute.tsx
apps/frontend/src/features/dashboard/components/DashboardPage.tsx
```

Main frontend additions:

- `OrganizationDashboardSummary` type
- `getOrganizationDashboardSummary(...)` API client
- `useOrganizationDashboardSummary(...)` hook
- workspace controller integration
- dashboard summary cards for task counts, members, pending invitations, and recent activity

## Smoke Coverage

The local smoke test validates the dashboard endpoint both directly through the backend and through the frontend API proxy.

Implemented file:

```text
scripts/local-smoke-test.sh
```

Smoke checks:

```text
GET /organizations/{organization_id}/dashboard
GET /api/organizations/{organization_id}/dashboard
```

The smoke test validates that the response includes:

- `organization_id`
- `task_counts`
- `members_count`
- `pending_invitations_count`
- `recent_activity_count`

## Validation Status

Validated successfully:

```text
make frontend-validate
make local-preview
local smoke test
```

Backend validation passed earlier for dashboard and organization-related tests:

```text
tests/test_organization_dashboard.py
tests/test_organization_tasks.py
tests/test_organization_audit_logs.py
tests/test_organization_invitations.py
```

## Commits In This Phase

```text
719e3df Add workspace dashboard summary endpoint
fdf502d Add workspace dashboard frontend summary
e6682ca Add workspace dashboard smoke coverage
```
