# Phase 3 Summary — Workspace / Organization SaaS Foundation

This document summarizes the current Phase 3 work.

## Phase goal

Turn the project from a simple authenticated task app into a workspace-based SaaS foundation.

High-level model:

```text
User -> Workspaces -> Members -> Tasks -> Dashboard -> Activity -> Settings
```

## Completed packages

### Package 3.1 — Organizations foundation

Completed:

- organization model
- organization member model
- create workspace
- list own workspaces
- get own workspace
- prevent access to another user's workspace
- frontend workspaces page
- sidebar workspace switcher

### Package 3.2 — Workspace membership foundation

Completed:

- owner/member roles
- members list endpoint
- frontend members page
- current user role detection
- member visibility
- workspace role display

### Package 3.3 — Invite-first membership policy

Completed:

- owner invites users
- only member role can be invited for now
- pending invitations
- invite candidate search
- accept invitation
- decline invitation
- cancel invitation
- duplicate pending invitation protection
- already-member protection

Important rule:

```text
Workspace membership is invite-first only.
```

### Package 3.4 — Workspace member management

Completed:

- owner can remove member
- owner cannot remove himself
- owner cannot remove another owner for now
- owner can transfer ownership
- old owner becomes member
- new owner becomes owner
- member cannot transfer ownership
- non-member cannot access

### Package 3.5 — Workspace leave flow

Completed:

- member can leave workspace
- owner cannot leave before transferring ownership
- frontend leave action
- stable backend error code for owner leave restriction

### Package 3.6 — Workspace task permission integration

Completed:

- organization task routes use permission policy
- owner/member can manage workspace tasks
- non-member cannot access
- permission helpers centralized in `permissions.py`
- regression tests added

### Package 3.7 — Workspace settings foundation

Completed:

- `/workspaces/:workspaceId/settings` route
- sidebar Settings item
- settings page foundation
- role-aware UI
- quick links
- access policy section
- leave workspace action for member
- owner leave restriction note
- collapsible sidebar UX

### Package 3.8 — Workspace rename foundation

Completed:

- `PATCH /organizations/{organization_id}`
- `OrganizationUpdate` schema
- `update_user_organization` service
- owner-only rename
- member receives 403
- non-member receives 404
- frontend rename form
- frontend API/hook/controller integration
- local smoke coverage for rename

## Remaining Phase 3 close-out

Recommended:

```text
Step 29.24 — Workspace documentation update
Step 29.25 — Phase 3 final validation and summary

Note: later work already expanded this foundation with audit logs, dashboard stats, public IDs, archive, and restore lifecycle support.
```

## Next phase

After Phase 3:

```text
Phase 4 — Team SaaS Productization / Workspace Admin Layer
```

Possible Phase 4 packages:

- audit logs
- workspace activity history
- workspace archive/restore/soft-delete lifecycle policy
- richer roles and permissions
- billing/subscription placeholder
- admin commands
- stronger observability


## Phase 4: Audit Log Foundation

After the workspace foundation was completed, the next productization step added a workspace audit log foundation.

### Backend Implementation

Added:

- `OrganizationAuditLog` model
- audit log repository helpers
- audit log service helpers
- `GET /organizations/{organization_id}/audit-logs`
- member-only audit log visibility
- audit event recording inside existing workspace service flows

The audit log currently records these workspace events:

```text
workspace_created
workspace_renamed
workspace_archived
workspace_restored
workspace_deleted
member_invited
invitation_accepted
invitation_declined
invitation_cancelled
member_removed
ownership_transferred
workspace_left
```

### Frontend Implementation

Added:

- `OrganizationAuditLog` frontend type
- `getOrganizationAuditLogs(...)` API client
- `useOrganizationAuditLogs(...)` hook
- workspace controller integration
- `WorkspaceActivityRoute`
- `WorkspaceActivityPage`
- Sidebar navigation item: `Activity`

Frontend route:

```text
/workspaces/:workspaceId/activity
```

### Validation

Backend validation:

- audit log foundation tests
- invitation lifecycle audit tests
- member removal audit tests
- ownership transfer audit tests
- workspace leave audit tests
- full backend test suite

Frontend validation:

- TypeScript build/typecheck
- frontend image build
- local preview

Smoke validation:

- backend audit log endpoint
- frontend API proxy audit log endpoint
- expected workspace create/rename audit events


## Phase 4: Workspace Dashboard, Public IDs, Archive, Restore, and Soft Delete

After the audit log foundation, the workspace admin layer was expanded with dashboard stats, public workspace IDs, and lifecycle management including archive, restore, and soft delete.

### Workspace dashboard stats

Completed:

- `GET /organizations/{organization_id_or_public_id}/dashboard`
- task counts by status
- members count
- pending invitations count
- recent activity count
- frontend dashboard summary cards
- backend and frontend validation
- local smoke coverage through backend direct URL and frontend `/api` proxy

### Workspace public IDs

Completed:

- `Organization.public_id`
- public ID generation with `ws_` prefix
- API support for public IDs across workspace, member, invitation, task, dashboard, and audit routes
- frontend route URLs using workspace public IDs
- frontend API calls using workspace public IDs
- smoke coverage validating public ID routes

Public ID rule:

```text
Browser/API route -> workspace.public_id
Backend/database  -> organization.id
```

### Workspace archive lifecycle

Completed:

- `Organization.status`
- active/archived workspace status model
- `POST /organizations/{organization_id_or_public_id}/archive`
- owner-only archive
- idempotent archive
- `workspace_archived` audit event
- archived workspace read-only policy
- backend blocks rename, invitations, and task writes on archived workspaces
- frontend archived status badge and read-only UI
- frontend archive action on Settings page

Archived write attempts use the stable backend error code:

```text
workspace_archived
```

### Workspace restore lifecycle

Completed:

- `POST /organizations/{organization_id_or_public_id}/restore`
- owner-only restore
- idempotent restore for already active workspaces
- `workspace_restored` audit event
- restored workspace returns to `active`
- task writes, rename, and invitations work again after restore
- frontend restore action on Settings page
- Activity page support for `workspace_restored`
- frontend proxy smoke validation for archive -> restore -> audit events

Current lifecycle:

```text
active -> archived -> active
active -> archived -> deleted
```


### Workspace soft delete lifecycle

Completed:

- `DELETE /organizations/{organization_id_or_public_id}`
- owner-only soft delete
- active workspaces must be archived before delete
- `workspace_delete_requires_archive` stable backend error code
- `workspace_deleted` audit event
- deleted workspaces are hidden from normal workspace list/get/public_id routes
- frontend Settings page delete action
- frontend delete flow navigates back to the workspace list after success
- local smoke validated create -> archive -> delete -> hidden behavior through the frontend API proxy

Soft delete is not hard delete. Related database records remain available for future retention, reporting, admin recovery, or hard-delete policy work.

### Validation

Validated:

- backend restore tests
- backend archive regression tests
- full backend tests
- frontend TypeScript/build validation
- local preview smoke
- frontend proxy restore smoke
- dev image tag update after merge

Current dev image tags after this lifecycle work:

```text
backend.image.tag:  7d7de22
frontend.image.tag: 284a3a0
```
