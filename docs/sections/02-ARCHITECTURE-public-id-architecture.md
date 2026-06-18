# Workspace public ID architecture

The backend keeps numeric database IDs for internal joins and relationships, but public-facing workspace routes and API calls should use workspace `public_id`.

Example:

```text
public URL/API ref: ws_8fK2xQm91aP
internal DB ID:     42
```

The backend resolves the route reference at the API boundary:

```text
public_id or legacy numeric ref -> organization row -> internal numeric id
```

Business logic, permission checks, and repository joins continue to use numeric IDs internally.

Frontend rules:

- browser routes use `/workspaces/:workspaceId` where `workspaceId` is `public_id`
- workspace API clients accept `OrganizationRef = number | string`
- controllers prefer `organization.public_id` for API calls
- numeric IDs may still be used for local in-memory selection, comparisons, and React keys
- user-facing UI should not display numeric workspace database IDs

Backend rules:

- routers may keep the historical parameter name `{organization_id}`
- route parameter type should be `str` for public-ID-compatible endpoints
- service layer resolves the reference through `resolve_organization_for_user(...)`
- non-members must receive `404` to avoid workspace existence leaks
