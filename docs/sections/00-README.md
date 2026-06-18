# Public ID Docs Update Package

This zip contains Markdown docs for Phase 40 — Public ID final audit / docs update.

Folders:

- `sections/` — standalone sections you can paste into existing docs.
- `full_docs/docs/` — full replacement docs for the workspace-related files.

Audit result summary:

- Frontend direct numeric `${organizationId}` path templates were removed from organization/task API clients.
- Workspace browser routes use public IDs like `/workspaces/ws_8fK2xQm91aP/tasks`.
- Backend route parameters still keep the historical `{organization_id}` name but accept string refs and resolve public IDs internally.
- Numeric IDs remain internal for database joins, permissions, React keys, and in-memory selection.
