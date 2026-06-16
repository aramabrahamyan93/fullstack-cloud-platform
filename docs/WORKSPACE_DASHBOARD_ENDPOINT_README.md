# Workspace Dashboard Endpoint

## Endpoint

```text
GET /organizations/{organization_id}/dashboard
```

## Responsibility

This endpoint returns a summary object for the selected workspace dashboard. It is intended for UI dashboard cards and smoke/regression checks.

## Authentication

The endpoint requires authenticated access.

## Authorization

The user must be a member of the workspace.

Expected behavior:

```text
owner      -> 200
member     -> 200
non-member -> 404 not_found
```

The non-member case intentionally returns 404 to avoid leaking workspace existence.

## Response Contract

```json
{
  "organization_id": 1,
  "task_counts": {
    "all": 0,
    "open": 0,
    "in_progress": 0,
    "done": 0
  },
  "members_count": 1,
  "pending_invitations_count": 0,
  "recent_activity_count": 0
}
```

## Contract Notes

The frontend should rely on field names, not human-readable backend messages.

Important fields:

```text
organization_id
task_counts.all
task_counts.open
task_counts.in_progress
task_counts.done
members_count
pending_invitations_count
recent_activity_count
```

## Current Counting Rules

Task counts are workspace-scoped and grouped by task status.

Member count includes active workspace members.

Pending invitations count includes invitations with status `pending`.

Recent activity count currently counts workspace audit log records used by the dashboard summary.

## Future Improvements

Possible future improvements:

- limit `recent_activity_count` to a time window
- add `recent_activity_items` preview
- add overdue tasks when task due dates exist
- add separate owner-only management metrics
- migrate route identifiers from numeric IDs to public workspace IDs after the public UID phase
