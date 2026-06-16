# Backend — Fullstack Cloud Platform

FastAPI backend service for the Fullstack Cloud Platform.

This README contains backend-specific information: backend architecture, API modules, service/repository flow, domain rules, backend tests, and backend development rules.

For general platform overview, local architecture, roadmap, cloud notes, and cross-cutting project decisions, see the root `README.md`.

## Tech stack

- Python 3.12
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT authentication
- Pytest
- Docker

## Backend responsibilities

The backend is responsible for:

- User registration and login
- JWT authentication
- Current user resolution
- Protected API access
- Domain rule enforcement
- Organization/workspace creation
- Workspace membership lifecycle
- Invitation lifecycle
- Workspace-scoped access control
- Task API and task query behavior
- Stable error codes for frontend/API contracts

The backend should remain the source of truth for security and domain rules. Frontend checks are useful for UX, but backend services must enforce access rules.

## Backend structure

```text
services/backend
├── app
│   ├── api
│   │   ├── exception_handlers.py
│   │   ├── health.py
│   │   ├── router.py
│   │   └── version.py
│   ├── core
│   │   ├── config.py
│   │   ├── errors.py
│   │   ├── logging.py
│   │   └── security.py
│   ├── db
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   └── init_db.py
│   ├── features
│   │   ├── auth
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   ├── organizations
│   │   │   ├── models.py
│   │   │   ├── repository.py
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   ├── tasks
│   │   │   ├── constants.py
│   │   │   ├── models.py
│   │   │   ├── repository.py
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   └── users
│   │       ├── models.py
│   │       └── repository.py
│   └── main.py
├── tests
├── Dockerfile
└── pyproject.toml
```

## Backend flow

Backend feature APIs should follow this flow:

```text
feature router -> feature service -> feature repository -> database
```

Layer responsibilities:

- Router: HTTP concerns, dependencies, response models.
- Service: domain logic, validation, permissions, business rules.
- Repository: database queries and persistence.
- Schema: request/response contracts.
- Model: SQLAlchemy persistence model.

Avoid placing business rules directly in routers or frontend code.

## Running backend locally

From repository root:

```bash
make up
```

Run backend tests:

```bash
make test
```

Run a specific test file:

```bash
bash scripts/compose.sh run --rm backend pytest tests/test_organizations.py -v
```

Run all backend tests directly through Docker Compose:

```bash
bash scripts/compose.sh run --rm backend pytest tests -v
```

Rebuild backend image:

```bash
bash scripts/compose.sh build backend
```

Rebuild backend image without cache:

```bash
bash scripts/compose.sh build --no-cache backend
```

## API areas

### Health and version

```text
GET /health
GET /health/live
GET /health/ready
GET /version
GET /metrics
```

### Authentication

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

The auth feature includes:

- Password hashing
- JWT access token creation
- JWT validation
- Current user dependency
- Centralized AppError responses

### Tasks

```text
GET    /tasks
GET    /tasks/paginated
GET    /tasks/stats
POST   /tasks
GET    /tasks/{task_id}
PUT    /tasks/{task_id}
DELETE /tasks/{task_id}
```

Tasks are protected. Task access should stay organization-aware and must not bypass workspace scope where organization ownership applies.

Task listing supports:

- Status filtering
- Title search
- Pagination
- Stats counters

Task query behavior should stay encapsulated behind request/query schemas and service/repository logic.

### Organizations

```text
POST /organizations
GET  /organizations
GET  /organizations/{organization_id}
```

`GET /organizations` returns the current user's workspaces and current role in each workspace.

Example response:

```json
[
  {
    "id": 1,
    "name": "My Workspace",
    "role": "owner"
  },
  {
    "id": 2,
    "name": "Team Workspace",
    "role": "member"
  }
]
```

## Workspace membership policy

Membership is invite-first.

Users can become workspace members only by accepting an invitation.

The direct member-add API is intentionally removed and must not be reintroduced as a public API.

Removed endpoint:

```text
POST /organizations/{organization_id}/members
```

Supported member-related endpoints:

```text
GET    /organizations/{organization_id}/members
DELETE /organizations/{organization_id}/members/{member_id}
POST   /organizations/{organization_id}/members/{member_id}/transfer-ownership
DELETE /organizations/{organization_id}/membership
```

Supported invitation endpoints:

```text
POST   /organizations/{organization_id}/invitations
GET    /organizations/{organization_id}/invitations
DELETE /organizations/{organization_id}/invitations/{invitation_id}

GET    /organizations/invitations/me
POST   /organizations/invitations/{invitation_id}/accept
POST   /organizations/invitations/{invitation_id}/decline
GET    /organizations/{organization_id}/invite-candidates?query=<query>
```

## Membership lifecycle

```text
Owner creates workspace
Owner invites user by email
Invited user sees pending invitation
Invited user accepts invitation
Backend creates OrganizationMember
User gets workspace access
```

Tests that need a member should use this invitation acceptance flow instead of direct member creation.

## Current roles

```text
owner
member
```

Current role rules:

- Creator of a workspace becomes owner.
- Only owners can create invitations.
- Only owners can cancel invitations.
- Only owners can remove members.
- Only owners can transfer ownership.
- Owners cannot leave a workspace before transferring ownership.
- Members can leave a workspace.
- Members cannot manage other members.
- Members cannot invite users.

## Backend error handling

Backend errors should use stable error codes.

Examples:

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

Frontend should rely on these codes and not parse backend message text.

## Database and migrations

Alembic migrations are intentionally postponed for the current MVP/local phase.

The backend currently initializes tables with SQLAlchemy `create_all()` during startup. This creates missing tables, but it does not alter existing tables.

For local development, if a model changes and the local database still has an old table schema, reset local volumes from the root directory:

```bash
make local-down
make local-clean
make local-preview
```

For any environment where data matters, use proper migrations with a safe migration/backfill plan instead of deleting tables or volumes.

## Test coverage

Important backend tests include:

```text
tests/test_auth.py
tests/test_organizations.py
tests/test_organization_invite_first_policy.py
tests/test_organization_invitations.py
tests/test_organization_invitation_acceptance.py
tests/test_organization_invite_candidates.py
tests/test_organization_members_endpoint.py
tests/test_organization_member_removal.py
tests/test_organization_ownership_transfer.py
tests/test_organization_leave.py
tests/test_tasks.py
```

Run organization-related tests:

```bash
bash scripts/compose.sh run --rm backend pytest \
  tests/test_organizations.py \
  tests/test_organization_invite_first_policy.py \
  tests/test_organization_invitations.py \
  tests/test_organization_invitation_acceptance.py \
  tests/test_organization_invite_candidates.py \
  tests/test_organization_members_endpoint.py \
  tests/test_organization_member_removal.py \
  tests/test_organization_ownership_transfer.py \
  tests/test_organization_leave.py \
  -v
```

Run all backend tests:

```bash
make test
```

## Backend development rules

- Keep route handlers thin.
- Put business rules in services.
- Put database access in repositories.
- Keep schemas as API contracts.
- Use stable error codes for expected API failures.
- Do not add direct member creation back.
- Use invitation accept flow for test setup when a member is needed.
- Keep tests repeatable and reset database state between tests.
- Avoid duplicating permission logic across multiple services.
- Keep organization scope enforced for tenant-owned data.
- Do not introduce Alembic migrations yet; migrations are postponed for now.

## Recommended next backend work

The next architecture step should be a role/permission foundation.

Suggested permission helpers:

```text
can_view_members
can_invite_members
can_cancel_invitations
can_remove_members
can_transfer_ownership
can_leave_workspace
can_manage_tasks
```

This will reduce scattered role checks and prepare the project for future roles such as `admin` or `viewer`.
