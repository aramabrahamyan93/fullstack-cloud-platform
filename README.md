# Fullstack Cloud Platform

Fullstack Cloud Platform is a local-first cloud platform project built with FastAPI, React, TypeScript, Vite, Nginx, PostgreSQL, Docker Compose, Kubernetes, Helm, Terraform, and AWS deployment tooling.

The project is focused on building a clean foundation for a production-ready platform: local development, authentication, protected APIs, workspace-based collaboration, local Kubernetes validation, cloud infrastructure, GitOps deployment, monitoring, and later AI/GenAI service capabilities.

This repository is intentionally built step by step. The goal is not only to create a simple CRUD application, but to grow a realistic fullstack/cloud platform with clean architecture, strong validation, and production-style workflows.

## Documentation split

The README files are intentionally split by scope:

- This root `README.md` explains the whole platform, main workflows, local architecture, validation, roadmap, and cross-cutting project decisions.
- `services/backend/README.md` explains backend-specific APIs, backend architecture, service/repository rules, tests, and backend domain policy.
- `apps/frontend/README.md` explains frontend-specific structure, routes, controllers, hooks, UI behavior, API usage, and frontend validation.

General platform concepts stay in the root README. Backend implementation details stay in the backend README. Frontend UI/component/controller details stay in the frontend README.

## Quick start

Show all available commands:

```bash
make help
```

Run the production-like local preview:

```bash
make local-preview
```

The local preview starts:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

Run the full local validation:

```bash
make validate-local-all
```

This runs both Docker Compose validation and local Kubernetes validation.

## Main local workflows

Fast Docker Compose validation:

```bash
make local-validate
```

Local Kubernetes and Helm validation with kind:

```bash
make local-k8s-validate
```

Run backend tests through Docker Compose:

```bash
make test
```

Run frontend validation/build:

```bash
make frontend-validate
```

Stop local services:

```bash
make local-down
```

Stop local services and remove local database volumes:

```bash
make local-clean
```

## Local architecture

The local Docker Compose stack contains:

- `backend` — FastAPI API running on `http://localhost:8000`
- `frontend` — React/Vite build served by Nginx on `http://localhost:3000`
- `postgres` — PostgreSQL 16 with a local Docker volume

The frontend calls the backend through the Nginx `/api` proxy.

That means the browser usually calls:

```text
http://localhost:3000/api/auth/login
http://localhost:3000/api/tasks
http://localhost:3000/api/organizations
```

Nginx forwards those requests internally to the backend:

```text
http://backend:8000/auth/login
http://backend:8000/tasks
http://backend:8000/organizations
```

Direct backend calls are also possible during local development:

```text
http://localhost:8000/auth/login
http://localhost:8000/tasks
http://localhost:8000/organizations
```

When calling the backend directly, do not include the `/api` prefix.

## Authentication workflow

The platform currently supports a local JWT authentication foundation:

- Register user
- Login user
- JWT access token
- Current user endpoint
- Protected API endpoints
- Authenticated workspace and task access

Auth endpoints:

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

Calling protected endpoints without a JWT access token returns `401 Unauthorized`.

## Auth curl examples

Register through the frontend proxy:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"strong-password"}'
```

Login through the frontend proxy:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"strong-password"}'
```

Store the returned access token:

```bash
TOKEN="PASTE_ACCESS_TOKEN_HERE"
```

Get current user:

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

Verify that protected APIs reject anonymous requests:

```bash
curl -i http://localhost:3000/api/tasks
```

Expected result:

```text
HTTP/1.1 401 Unauthorized
```

## Task workflow

Task endpoints are protected:

```text
GET    /tasks
GET    /tasks/paginated
GET    /tasks/stats
POST   /tasks
GET    /tasks/{task_id}
PUT    /tasks/{task_id}
DELETE /tasks/{task_id}
```

Task listing supports status filtering, title search, and pagination:

```text
GET /tasks?status=open
GET /tasks?search=docker
GET /tasks?status=open&search=docker&limit=10&offset=0
GET /tasks/paginated?limit=5&offset=0
GET /tasks/paginated?status=done&search=release&limit=10&offset=0
GET /tasks/stats
```

List tasks with authentication:

```bash
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN"
```

List paginated tasks:

```bash
curl "http://localhost:3000/api/tasks/paginated?limit=5&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

Search tasks by title:

```bash
curl "http://localhost:3000/api/tasks/paginated?search=docker&limit=5&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

Filter tasks by status:

```bash
curl "http://localhost:3000/api/tasks/paginated?status=open&limit=5&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

Get task dashboard stats:

```bash
curl http://localhost:3000/api/tasks/stats \
  -H "Authorization: Bearer $TOKEN"
```

Create a protected task:

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Protected task","status":"open"}'
```

## Task ownership and workspace scope

The platform started with user-owned protected tasks and then evolved toward organization-aware task ownership.

Current direction:

- Tasks must be protected by authentication.
- Tenant-owned data must be scoped by organization/workspace where applicable.
- Requests for inaccessible resources should return `404 Not Found` instead of leaking whether another user's or another workspace's resource exists.
- Future repository/service changes should continue enforcing organization scope consistently.

## Organizations and workspaces

The platform includes an organization/workspace foundation.

Organization endpoints:

```text
POST /organizations
GET  /organizations
GET  /organizations/{organization_id}
```

The workspaces list returns the current user's role for each workspace:

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

Current workspace rules:

- A user may belong to multiple workspaces.
- A workspace has members.
- Each member has a role.
- Current MVP roles are `owner` and `member`.
- Workspace owners can invite users.
- Workspace owners can cancel pending invitations.
- Workspace owners can remove members.
- Workspace owners can transfer ownership.
- Workspace owners cannot leave before transferring ownership.
- Workspace members can leave.
- Workspace members cannot remove other members.
- Workspace members cannot transfer ownership.
- Workspace members cannot invite users.

## Invite-first workspace membership policy

Workspace membership is invite-first.

Users can join a workspace only by accepting an invitation. Owners can create invitations, cancel pending invitations, remove existing members, transfer ownership, and manage workspace-level access.

The direct member-add API is intentionally not exposed.

Removed legacy endpoint:

```text
POST /organizations/{organization_id}/members
```

The supported membership lifecycle is:

```text
Owner creates invitation
Invited user accepts invitation
System creates OrganizationMember
Member receives workspace access
```

The platform must not reintroduce a public endpoint that directly creates workspace members without invitation acceptance.

Any future admin-only or internal member-management flow must be explicitly designed, protected, documented, and tested separately.

## Workspace member endpoints

```text
GET    /organizations/{organization_id}/members
DELETE /organizations/{organization_id}/members/{member_id}
POST   /organizations/{organization_id}/members/{member_id}/transfer-ownership
DELETE /organizations/{organization_id}/membership
```

## Workspace invitation endpoints

```text
POST   /organizations/{organization_id}/invitations
GET    /organizations/{organization_id}/invitations
DELETE /organizations/{organization_id}/invitations/{invitation_id}

GET    /organizations/invitations/me
POST   /organizations/invitations/{invitation_id}/accept
POST   /organizations/invitations/{invitation_id}/decline
GET    /organizations/{organization_id}/invite-candidates?query=<query>
```

## Workspace curl examples

Create a workspace:

```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"My Workspace"}'
```

List current user's workspaces:

```bash
curl http://localhost:3000/api/organizations \
  -H "Authorization: Bearer $TOKEN"
```

List workspace members:

```bash
curl http://localhost:3000/api/organizations/1/members \
  -H "Authorization: Bearer $TOKEN"
```

Create invitation:

```bash
curl -X POST http://localhost:3000/api/organizations/1/invitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"member@example.com","role":"member"}'
```

List current user's pending invitations:

```bash
curl http://localhost:3000/api/organizations/invitations/me \
  -H "Authorization: Bearer $TOKEN"
```

Accept invitation:

```bash
curl -X POST http://localhost:3000/api/organizations/invitations/1/accept \
  -H "Authorization: Bearer $TOKEN"
```

Decline invitation:

```bash
curl -X POST http://localhost:3000/api/organizations/invitations/1/decline \
  -H "Authorization: Bearer $TOKEN"
```

Leave workspace:

```bash
curl -X DELETE http://localhost:3000/api/organizations/1/membership \
  -H "Authorization: Bearer $TOKEN"
```

Transfer ownership:

```bash
curl -X POST http://localhost:3000/api/organizations/1/members/2/transfer-ownership \
  -H "Authorization: Bearer $TOKEN"
```

Remove member:

```bash
curl -X DELETE http://localhost:3000/api/organizations/1/members/2 \
  -H "Authorization: Bearer $TOKEN"
```

## Local database reset note

Alembic migrations are intentionally postponed for the current MVP/local phase.

The backend currently initializes tables with SQLAlchemy `create_all()` during startup. This creates missing tables, but it does not alter existing tables.

If a model changes and the local database still has an old table schema, local reset may be needed.

Stop services:

```bash
make local-down
```

Remove local volumes:

```bash
make local-clean
```

Or manually remove the project PostgreSQL volume:

```bash
docker volume ls | grep fullstack-cloud-platform
docker volume rm fullstack-cloud-platform_postgres-data
```

Then start again:

```bash
make local-preview
```

This is only acceptable for local development data.

For any environment where data matters, use proper migrations with a safe migration/backfill plan instead of deleting tables or volumes.

## Smoke tests

The local smoke test validates:

- Backend health
- Backend liveness
- Backend readiness
- Backend version
- Backend metrics
- User registration
- User login
- Current user endpoint with JWT
- `/tasks` returns `401` without token
- `/tasks` works with token
- Task creation with token
- Frontend availability
- Frontend `/api` proxy health
- Frontend `/api` proxy protected task flow

Run it with:

```bash
make local-smoke-test
```

The production-like local preview also runs the smoke test:

```bash
make local-preview
```

## Frontend overview

The frontend is built with React, TypeScript, Vite, and Nginx.

High-level frontend concepts:

- Application shell and route composition live under `apps/frontend/src/app`.
- Feature UI, hooks, and API modules live under `apps/frontend/src/features`.
- Shared API client and reusable UI components live under `apps/frontend/src/shared`.
- Detailed frontend structure and UI behavior are documented in `apps/frontend/README.md`.

## Backend overview

The backend is built with FastAPI and SQLAlchemy.

High-level backend concepts:

- Route aggregation and system endpoints live under `services/backend/app/api`.
- Core configuration, security, logging, and error handling live under `services/backend/app/core`.
- Database setup and dependencies live under `services/backend/app/db`.
- Feature modules live under `services/backend/app/features`.
- Detailed backend structure, service/repository flow, and backend test details are documented in `services/backend/README.md`.

Backend API follows this flow:

```text
feature router -> feature service -> feature repository -> database
```

## Error handling and API contract

Backend error codes are part of the API contract.

Frontend should map stable backend error codes to user-facing messages and should not rely on backend message text.

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

## Current validated status

The project currently has a working local Docker Compose workflow and a working local Kubernetes workflow.

Current validated capabilities:

- FastAPI backend starts successfully
- PostgreSQL starts and becomes healthy
- Backend initializes database tables on startup
- Backend exposes `/health`, `/health/live`, `/health/ready`, `/version`, and `/metrics`
- Backend supports user register/login/current user flow
- Backend protects protected APIs with JWT authentication
- Backend supports organization/workspace creation
- Backend returns current user role in organization list
- Backend supports invite-first workspace membership
- Backend creates members through invitation acceptance
- Backend does not expose a direct member-add endpoint
- Backend supports pending invitations
- Backend supports invitation accept/decline
- Backend supports invitation cancellation
- Backend supports invite candidate search
- Backend supports member removal
- Backend supports ownership transfer
- Backend supports leaving a workspace
- Backend supports task status filtering
- Backend supports task title search
- Backend supports paginated task responses with total count
- Backend exposes task stats counters through `/tasks/stats`
- Backend uses a `TaskListQuery` object internally for task list filtering/search/pagination
- Frontend is served by Nginx
- Frontend connects to the backend through the `/api` Nginx proxy
- Frontend supports login/register/logout
- Frontend sends JWT access token through the API client Authorization header
- Frontend supports workspace list, workspace role display, invitations, members, ownership transfer, remove, and leave flows
- Frontend can create, update, delete, and list protected tasks after login
- Frontend supports task dashboard counters
- Frontend supports task status filtering
- Frontend supports task title search
- Frontend supports paginated task loading with total page count
- Frontend supports configurable page size: 5 / 10 / 20
- Frontend task loading uses object-based load options inside `useTasks`
- Docker Compose smoke tests validate auth-aware backend, frontend, proxy, and task flow
- Backend tests pass successfully
- Frontend TypeScript build validation passes successfully
- Helm chart renders and deploys successfully in local kind Kubernetes

## Testing

Run backend tests:

```bash
make test
```

Run frontend validation:

```bash
make frontend-validate
```

Run local smoke test:

```bash
make local-smoke-test
```

Run complete local validation:

```bash
make validate-local-all
```

Useful targeted backend test command:

```bash
bash scripts/compose.sh run --rm backend pytest tests -v
```

Useful organization-related targeted test command:

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

## Documentation

Detailed documentation is available in the `docs/` directory:

- [Project overview](docs/PROJECT_OVERVIEW.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Project structure](docs/PROJECT_STRUCTURE.md)
- [Local development](docs/LOCAL_DEVELOPMENT.md)
- [Infrastructure](docs/INFRASTRUCTURE.md)
- [Deployment flow](docs/DEPLOYMENT_FLOW.md)
- [CI/CD](docs/CI_CD.md)
- [Operations](docs/OPERATIONS.md)
- [Roadmap](docs/ROADMAP.md)
- [Architecture standards](docs/ARCHITECTURE_STANDARDS.md)
- [Backend README](services/backend/README.md)
- [Frontend README](apps/frontend/README.md)

## Current roadmap

### Optional local monitoring stack

Local Helm deploy keeps backend `ServiceMonitor` disabled by default because a fresh kind cluster does not include Prometheus Operator CRDs.

Use the optional local monitoring flow when you want to validate Prometheus/Grafana scraping in kind:

```bash
make local-monitoring-up
make local-k8s-deploy-monitoring
make local-monitoring-status
```

This installs the local `kube-prometheus-stack`, deploys the app with `helm/platform/values-local-monitoring.yaml`, and creates the backend `ServiceMonitor`.

The validated local metrics path is:

```text
backend /metrics
→ ServiceMonitor backend in fullstack-local
→ Prometheus target job=backend service=backend
→ Prometheus up value = 1
```

Cleanup is optional and local-only:

```bash
make local-monitoring-down
```

The default `make local-k8s-deploy` and `make local-k8s-validate` workflows still do not install monitoring or render `ServiceMonitor`.

## Development workflow

Recommended workflow after each meaningful step:

```bash
git status
git diff --stat
make test
make frontend-validate
git add ...
git commit -m "<clear message>"
git push
```

## Important project decisions

### Alembic migrations

Alembic migrations are intentionally postponed for the current MVP/local phase.

Before using environments where data matters, add proper migrations with a safe migration/backfill plan.

### Invite-first membership

Direct workspace member creation was removed.

Membership must be created through invitation acceptance.

### Error codes

Backend error codes are API contract.

Frontend should depend on stable error codes, not backend message text.

### Cloud cost control

Local Docker Compose and local kind workflows do not create AWS resources.

AWS resources such as EKS, RDS, NAT Gateway, Load Balancers, ECR, and related services may generate cost. Enable them only when needed for testing, and destroy or disable them after validation if they are not required.

Keep cost-generating cloud resources disabled by default unless explicitly needed.


### Current dev cloud safety state

The current dev account keeps cost-sensitive infrastructure disabled unless explicitly enabled for testing.

Recent infrastructure safety changes:

- Terraform account variables are split by account and stack under `infra/accounts/<account>/`.
- ECR defaults live in `infra/config/ecr.tfvars`.
- The dev account overrides ECR repositories to disabled in `infra/accounts/dev-859981975099/ecr.tfvars`.
- Automatic ECR image publishing is disabled while dev ECR repositories are disabled.
- `make cloud-deploy` passes `IMAGE_TAG` through the same environment chain as the other cloud deploy values.

Before re-enabling cloud resources or ECR publishing, run and review the relevant Terraform plan.
