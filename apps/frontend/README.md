# Frontend — Fullstack Cloud Platform

React/TypeScript frontend for the Fullstack Cloud Platform.

This README contains frontend-specific information: application structure, routes, feature modules, hooks, UI behavior, API usage, and frontend validation.

For general platform overview, local architecture, roadmap, cloud notes, and cross-cutting project decisions, see the root `README.md`.

## Tech stack

- React
- TypeScript
- Vite
- Nginx production container
- Feature-based frontend structure

## Frontend responsibilities

The frontend is responsible for:

- Authentication UI
- Token-aware API calls
- Workspace list and selected workspace UX
- Workspace dashboard
- Workspace tasks UI
- Workspace members UI
- Invitation UX
- Invite candidate search UX
- Ownership transfer UX
- Leave workspace UX
- User-facing error messages based on stable backend error codes
- Route-level workspace access validation to avoid stale UI

Frontend checks improve UX, but backend services remain the source of truth for permissions and domain rules.

## Frontend structure

```text
apps/frontend
├── src
│   ├── app
│   │   ├── hooks
│   │   └── routes
│   ├── features
│   │   ├── auth
│   │   ├── organizations
│   │   ├── system
│   │   └── tasks
│   └── shared
│       ├── api
│       └── components
├── Dockerfile
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Main frontend areas

### App layer

The app layer owns routing and high-level controller composition.

Important files:

```text
src/app/hooks/useAppBootstrap.ts
src/app/hooks/useAppController.ts
src/app/hooks/useAppMessage.ts
src/app/hooks/useAuthController.ts
src/app/hooks/useSystemStatus.ts
src/app/hooks/useTaskController.ts
src/app/hooks/useWorkspaceController.ts
src/app/hooks/useWorkspaceRouteContext.ts

src/app/routes/GlobalDashboardRoute.tsx
src/app/routes/WorkspacesRoute.tsx
src/app/routes/WorkspaceDashboardRoute.tsx
src/app/routes/WorkspaceTasksRoute.tsx
src/app/routes/WorkspaceMembersRoute.tsx
src/app/routes/SystemRoute.tsx
```

### Auth feature

Handles login/register/logout and token persistence.

```text
src/features/auth
```

Important responsibilities:

- Login
- Register
- Logout
- Token storage
- Current user restore
- Authenticated API state

### Organizations feature

Handles workspaces, members, invitations, invite candidates, ownership transfer, and leave flow.

```text
src/features/organizations
```

Important responsibilities:

- Workspace list
- Workspace creation
- Workspace role display
- Workspace member list
- Owner invitation flow
- Current user's pending invitations
- Accept/decline invitations
- Cancel pending invitations
- Invite candidate search
- Remove member
- Transfer ownership
- Leave workspace

### Tasks feature

Handles task list, create, update, delete, and workspace-scoped task UI.

```text
src/features/tasks
```

Important responsibilities:

- Load paginated tasks
- Load task stats
- Status filtering
- Title search
- Page size handling
- Create task
- Update task
- Delete task

### Shared layer

Contains shared API client, error mapping, and shared UI components.

```text
src/shared
```

Important responsibilities:

- `fetchJson` API client
- Authorization header handling
- Backend error code mapping
- Shared layout/navigation components
- Shared message component

## Running frontend locally

From repository root:

```bash
make up
```

Validate frontend:

```bash
make frontend-validate
```

Build frontend container:

```bash
bash scripts/compose.sh build frontend
```

Local preview:

```bash
make local-preview
```

## Frontend routes

```text
/dashboard
/workspaces
/workspaces/:workspaceId/dashboard
/workspaces/:workspaceId/tasks
/workspaces/:workspaceId/members
/system
```

## Workspace UX

### Global dashboard

The global dashboard shows general user-level information and pending invitations for the current user.

### Workspaces page

The workspaces page allows users to:

- Create a workspace
- View all workspaces they belong to
- See their role in each workspace
- Open a workspace
- Leave a workspace if their role is `member`

Owners do not see a leave action on the workspace list because owners must transfer ownership first.

### Workspace dashboard

The workspace dashboard shows selected workspace context and workspace-level actions.

It should stay focused on workspace summary and navigation. Detailed member management belongs on the workspace members page.

### Workspace tasks page

The workspace tasks page shows task management under workspace context.

It should not load unrelated member/invitation data unless needed for a specific action.

### Workspace members page

The members page allows owners to:

- View workspace members
- Search registered invite candidates
- Invite users by email
- View pending invitations
- Cancel pending invitations
- Remove members
- Transfer ownership

Members can:

- View members
- Leave workspace

## Invite-first membership policy

Frontend must follow the backend invite-first membership policy.

The frontend must not call a direct add-member endpoint.

Removed legacy API function:

```text
addOrganizationMember(...)
```

Supported membership/invitation frontend API calls:

```text
getOrganizationMembers
createOrganizationInvitation
getOrganizationInvitations
cancelOrganizationInvitation
getMyOrganizationInvitations
acceptMyOrganizationInvitation
declineMyOrganizationInvitation
getOrganizationInviteCandidates
removeOrganizationMember
transferOrganizationOwnership
leaveOrganization
```

The supported UI flow is:

```text
Owner searches candidate or types email
Owner creates invitation
Invited user sees invitation on dashboard
Invited user accepts invitation
Frontend reloads organizations/members
User gets workspace access
```

## Destructive actions

Destructive or access-removing actions should use danger styling.

Danger actions:

```text
Leave workspace
Remove member
```

Neutral/secondary actions:

```text
Open workspace
Transfer ownership
Cancel invitation
```

Transfer ownership is not styled as danger because it does not remove the target user, but it must still require confirmation.

## Error handling

Frontend should use stable backend error codes and map them to user-friendly messages.

Do not parse backend message text.

Important error codes include:

```text
not_found
forbidden
workspace_invitation_invalid_role
workspace_invitation_user_already_member
workspace_invitation_already_pending
workspace_invitation_not_pending
workspace_invitation_expired
workspace_member_self_remove_not_allowed
workspace_member_owner_remove_not_allowed
workspace_ownership_self_transfer_not_allowed
workspace_ownership_target_already_owner
workspace_ownership_target_invalid_role
workspace_owner_cannot_leave_before_transfer
```

## Route validation

Workspace routes should validate that the current user still has access to the selected workspace.

If access is lost because the user was removed or left the workspace, the frontend should:

- Clear stale workspace members
- Clear stale invitations
- Clear stale invite candidates
- Reload workspaces
- Redirect to `/workspaces`
- Avoid showing stale workspace content

The route validation hook should keep URL state, selected workspace state, and loaded workspace data consistent.

## API client rules

Frontend API modules should own endpoint strings.

UI components should not hardcode backend URLs.

The shared API client should handle:

- JSON requests
- JSON responses
- Authorization header
- Backend AppError response mapping
- Unexpected network/API failures

## Validation

Run:

```bash
make frontend-validate
```

This should run TypeScript validation and production frontend build.

Run local preview:

```bash
make local-preview
```

## Development rules

- Keep UI components focused on rendering.
- Put API calls in feature API files.
- Put feature state/actions in hooks.
- Keep app-level orchestration in app controllers.
- Avoid direct backend endpoint strings inside UI components.
- Do not reintroduce direct member-add flow.
- Prefer backend error code mapping over message parsing.
- Use confirmation dialogs for destructive or ownership-changing actions.
- Keep workspace route context in sync with URL parameters.
- Avoid loading unrelated workspace data on routes that do not need it.
- Keep destructive actions visually distinct with danger styling.
- Keep owner/member UI behavior aligned with backend permissions.

## Recommended next frontend work

Suggested next improvements:

1. Permission-aware UI helpers
2. Workspace settings page
3. Better invitation empty/loading states
4. More consistent button system
5. Toast/notification replacement for simple message area
6. Better mobile layout for workspace members and invitations
7. Frontend tests for workspace role-based action visibility
