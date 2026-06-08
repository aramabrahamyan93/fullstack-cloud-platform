# Fullstack Cloud Platform

Fullstack Cloud Platform is a local-first cloud platform project built with FastAPI, React, TypeScript, Vite, Nginx, PostgreSQL, Docker Compose, Kubernetes, Helm, Terraform, and AWS deployment tooling.

The project is focused on building a clean foundation for a production-ready platform: local development, authentication, protected APIs, local Kubernetes validation, cloud infrastructure, GitOps deployment, monitoring, and later AI/GenAI service capabilities.

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
```

Nginx forwards those requests internally to the backend:

```text
http://backend:8000/auth/login
http://backend:8000/tasks
```

Direct backend calls are also possible during local development:

```text
http://localhost:8000/auth/login
http://localhost:8000/tasks
```

When calling the backend directly, do not include the `/api` prefix.

## Authentication workflow

The platform currently supports a local JWT authentication foundation:

- Register user
- Login user
- JWT access token
- Current user endpoint
- Protected task endpoints
- Task ownership per user

Auth endpoints:

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

Task endpoints are protected:

```text
GET    /tasks
POST   /tasks
GET    /tasks/{task_id}
PUT    /tasks/{task_id}
DELETE /tasks/{task_id}
```

Calling `/tasks` without a JWT access token returns `401 Unauthorized`.

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

Verify that tasks are protected:

```bash
curl -i http://localhost:3000/api/tasks
```

Expected result:

```text
HTTP/1.1 401 Unauthorized
```

List tasks with authentication:

```bash
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN"
```

Create a protected task:

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Protected task","status":"open"}'
```

## Protected task ownership

Tasks are owned by the authenticated user.

Current behavior:

- User A sees only User A tasks
- User B sees only User B tasks
- User B cannot read, update, or delete User A tasks
- Requests for another user's task return `404 Not Found`

This avoids leaking whether another user's task ID exists.

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

## Frontend structure

The frontend is built with React, TypeScript, and Vite.

Current frontend structure includes:

- API clients under `apps/frontend/src/api`
- Auth token storage under `apps/frontend/src/auth`
- Auth state hook: `useAuth`
- Task state hook: `useTasks`
- Reusable UI components under `apps/frontend/src/components`
- Shared types under `apps/frontend/src/types`

Current auth/task flow:

```text
App
 ├─ useAuth
 │   ├─ login/register/logout
 │   ├─ token storage
 │   └─ current user restore
 ├─ useTasks
 │   ├─ load tasks
 │   ├─ create task
 │   ├─ update task
 │   └─ delete task
 ├─ AuthPanel
 ├─ TaskForm
 └─ TaskList
```

## Backend structure

The backend is built with FastAPI and SQLAlchemy.

Current backend structure includes:

- API routers under `services/backend/app/api`
- Core config/security/error handling under `services/backend/app/core`
- Database setup under `services/backend/app/db`
- Models under `services/backend/app/models`
- Repositories under `services/backend/app/repositories`
- Services under `services/backend/app/services`
- Schemas under `services/backend/app/schemas`
- Tests under `services/backend/tests`

Task API follows this flow:

```text
router -> service -> repository -> database
```

Auth API includes:

- Password hashing
- JWT access token creation
- JWT validation
- Current user dependency
- Centralized AppError responses

## Current validated status

The project currently has a working local Docker Compose workflow and a working local Kubernetes workflow.

Current validated capabilities:

- FastAPI backend starts successfully
- PostgreSQL starts and becomes healthy
- Backend initializes database tables on startup
- Backend exposes `/health`, `/health/live`, `/health/ready`, `/version`, and `/metrics`
- Backend supports user register/login/current user flow
- Backend protects `/tasks` with JWT authentication
- Backend scopes tasks by authenticated user ownership
- Frontend is served by Nginx
- Frontend connects to the backend through the `/api` Nginx proxy
- Frontend supports login/register/logout
- Frontend sends JWT access token through the API client Authorization header
- Frontend can create, update, delete, and list protected tasks after login
- Docker Compose smoke tests validate auth-aware backend, frontend, proxy, and task flow
- Backend tests pass successfully
- Frontend TypeScript build validation passes successfully
- Helm chart renders and deploys successfully in local kind Kubernetes

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

## Current roadmap

Near-term roadmap:

1. Keep improving local development workflow
2. Keep backend/frontend architecture clean and extensible
3. Add documentation for auth, protected APIs, and smoke tests
4. Add CI checks for the new auth-aware workflow
5. Add Alembic migrations before using environments where data matters
6. Add task filters/search/status dashboard
7. Add roles/permissions foundation
8. Continue monitoring/logging improvements
9. Prepare cloud deployment hardening
10. Add AWS/AI integrations later

## AWS cost note

Local Docker Compose and local kind workflows do not create AWS resources.

AWS resources such as EKS, RDS, NAT Gateway, Load Balancers, ECR, and related services may generate cost. Enable them only when needed for testing, and destroy or disable them after validation if they are not required.

Keep cost-generating cloud resources disabled by default unless explicitly needed.
