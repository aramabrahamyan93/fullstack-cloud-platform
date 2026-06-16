# Workspace Dashboard Smoke Coverage

## Purpose

The smoke test now checks the workspace dashboard summary endpoint to catch regressions in backend routing, auth, response shape, and frontend API proxy routing.

## File

```text
scripts/local-smoke-test.sh
```

## Added Helper

```text
check_workspace_dashboard_flow()
```

The helper calls:

```text
GET /organizations/{organization_id}/dashboard
```

It validates that the response contains:

```text
organization_id
task_counts
members_count
pending_invitations_count
recent_activity_count
```

## Backend Smoke Check

```text
GET http://localhost:8000/organizations/{organization_id}/dashboard
```

## Frontend API Proxy Smoke Check

```text
GET http://localhost:3000/api/organizations/{organization_id}/dashboard
```

## Expected Output

```text
Checking backend workspace dashboard summary: http://localhost:8000/organizations/{id}/dashboard
OK: backend workspace dashboard summary

Checking frontend API proxy workspace dashboard summary: http://localhost:3000/api/organizations/{id}/dashboard
OK: frontend API proxy workspace dashboard summary
```

## Validation

Validated successfully with:

```text
make frontend-validate
make local-preview
```

The local smoke test completed successfully after the dashboard smoke helper was added.
