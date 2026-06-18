# Workspace public ID policy

Workspaces have both an internal numeric database ID and a public ID.

Example public ID:

```text
ws_8fK2xQm91aP
```

Policy:

- numeric IDs remain internal database identifiers
- public URLs should use `public_id`
- frontend workspace routes use `public_id`
- frontend workspace API calls should prefer `public_id`
- backend route parameters still use the historical name `{organization_id}`, but they accept both legacy numeric IDs and public IDs
- new user-facing docs and examples should show public IDs, not numeric database IDs

Current public workspace API examples:

```text
GET    /organizations/ws_8fK2xQm91aP
PATCH  /organizations/ws_8fK2xQm91aP
GET    /organizations/ws_8fK2xQm91aP/dashboard
GET    /organizations/ws_8fK2xQm91aP/audit-logs
GET    /organizations/ws_8fK2xQm91aP/members
GET    /organizations/ws_8fK2xQm91aP/invitations
POST   /organizations/ws_8fK2xQm91aP/invitations
GET    /organizations/ws_8fK2xQm91aP/invite-candidates
DELETE /organizations/ws_8fK2xQm91aP/members/{member_id}
POST   /organizations/ws_8fK2xQm91aP/members/{member_id}/transfer-ownership
DELETE /organizations/ws_8fK2xQm91aP/membership
GET    /organizations/ws_8fK2xQm91aP/tasks
POST   /organizations/ws_8fK2xQm91aP/tasks
GET    /organizations/ws_8fK2xQm91aP/tasks/paginated
GET    /organizations/ws_8fK2xQm91aP/tasks/stats
GET    /organizations/ws_8fK2xQm91aP/tasks/{task_id}
PUT    /organizations/ws_8fK2xQm91aP/tasks/{task_id}
DELETE /organizations/ws_8fK2xQm91aP/tasks/{task_id}
```
