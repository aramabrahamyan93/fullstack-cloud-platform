# Workspace Dashboard Frontend Integration

## Purpose

The workspace dashboard page now displays backend-driven summary cards instead of relying only on local task counters.

## Main Files

```text
apps/frontend/src/features/organizations/types.ts
apps/frontend/src/features/organizations/api.ts
apps/frontend/src/features/organizations/hooks/useOrganizationDashboardSummary.ts
apps/frontend/src/app/hooks/useWorkspaceController.ts
apps/frontend/src/app/routes/WorkspaceDashboardRoute.tsx
apps/frontend/src/features/dashboard/components/DashboardPage.tsx
```

## Data Flow

```text
WorkspaceDashboardRoute
  -> useWorkspaceRouteContext
  -> useWorkspaceController
  -> useOrganizationDashboardSummary
  -> getOrganizationDashboardSummary
  -> GET /organizations/{organization_id}/dashboard
  -> DashboardPage summary cards
```

## UI Cards

The dashboard displays:

- current user
- all tasks
- open tasks
- in-progress tasks
- done tasks
- members
- pending invitations
- recent activity

## Loading Behavior

When a workspace route is opened, the route loads the dashboard summary for the selected workspace.

If the workspace changes, the summary is reloaded for the new workspace.

If there is no workspace context, the summary state is cleared.

## Fallback Behavior

`DashboardPage` still accepts `taskCounters` as fallback data.

If `workspaceSummary` is not loaded yet:

- task cards use existing task counters
- workspace-specific cards show `—`

This keeps the dashboard stable during loading and avoids breaking older route usage.

## Validation

Frontend validation passed with:

```text
make frontend-validate
make local-preview
```
