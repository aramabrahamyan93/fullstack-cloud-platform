# Public ID close-out

Workspace public IDs were added after the workspace foundation and audit/dashboard phases.

Completed:

- `Organization.public_id`
- public ID generator with `ws_` prefix
- backend workspace routes accept public ID refs
- backend workspace task routes accept public ID refs
- frontend workspace routes use public IDs
- frontend workspace task APIs use public IDs
- frontend workspace members/invitations/invite-candidates/ownership/leave APIs use public IDs
- numeric DB IDs remain internal for joins, permissions, and local in-memory selection
- direct numeric organization path templates were removed from frontend organization API clients

Policy:

```text
Public route/API ref: workspace public_id
Internal persistence: numeric id
```
