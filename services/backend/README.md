# Backend Service

This service contains the FastAPI backend for the Fullstack Cloud Platform project.

It provides the API foundation for:

- health and version endpoints,
- JWT authentication,
- protected task management,
- task ownership isolation,
- task filtering,
- task title search,
- task pagination,
- task stats,
- metrics endpoint foundation.

## Stack

- Python 3.12
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic v2
- JWT authentication
- pytest

## Local usage

From the repository root, run backend tests through Docker Compose:

```bash
make test
```

Run the local production-like preview:

```bash
make local-preview
```

The backend is available directly at:

```text
http://localhost:8000
```

When accessed through the frontend Nginx proxy, API calls use:

```text
http://localhost:3000/api
```

The backend routes themselves do not include the `/api` prefix.

## Main endpoints

System endpoints:

```text
GET /health
GET /health/live
GET /health/ready
GET /version
GET /metrics
```

Authentication endpoints:

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

Task endpoints:

```text
GET    /tasks
GET    /tasks/paginated
GET    /tasks/stats
POST   /tasks
GET    /tasks/{task_id}
PUT    /tasks/{task_id}
DELETE /tasks/{task_id}
```

## Authentication

Task endpoints require a JWT access token.

Unauthenticated task requests return:

```text
401 Unauthorized
```

The current user is resolved from the JWT token through the backend auth dependency.

## Task ownership

Tasks are scoped by authenticated user ownership.

Current behavior:

- users see only their own tasks,
- users cannot read, update, or delete tasks owned by other users,
- accessing another user's task returns `404 Not Found`.

Returning `404` avoids leaking whether another user's task ID exists.

## Task filtering, search, and pagination

Task list endpoints support:

```text
status
search
limit
offset
```

Examples:

```text
GET /tasks?status=open
GET /tasks?search=docker
GET /tasks?status=open&search=docker&limit=10&offset=0
GET /tasks/paginated?limit=5&offset=0
GET /tasks/paginated?status=done&search=release&limit=10&offset=0
```

Paginated response format:

```json
{
  "items": [],
  "total": 0,
  "limit": 5,
  "offset": 0
}
```

Task stats endpoint:

```text
GET /tasks/stats
```

Response example:

```json
{
  "all": 4,
  "open": 2,
  "in_progress": 1,
  "done": 1
}
```

## Backend structure

```text
services/backend/app/
├── api/
│   ├── exception_handlers.py
│   ├── health.py
│   ├── router.py
│   └── version.py
├── core/
│   ├── config.py
│   ├── errors.py
│   ├── logging.py
│   └── security.py
├── db/
│   ├── database.py
│   ├── dependencies.py
│   └── init_db.py
├── features/
│   ├── auth/
│   │   ├── router.py
│   │   ├── schemas.py
│   │   └── service.py
│   ├── tasks/
│   │   ├── constants.py
│   │   ├── models.py
│   │   ├── repository.py
│   │   ├── router.py
│   │   ├── schemas.py
│   │   └── service.py
│   └── users/
│       ├── models.py
│       └── repository.py
└── main.py
```

The backend follows a feature-based modular monolith structure.

Main areas:

- `api` contains application-level router aggregation, health/version endpoints, and exception handlers.
- `core` contains shared configuration, logging, security helpers, and application errors.
- `db` contains SQLAlchemy database setup, dependencies, and local table initialization.
- `features/auth` contains authentication API, schemas, and service logic.
- `features/users` contains the user model and user repository.
- `features/tasks` contains task API, task model, repository, service, schemas, and constants.

Task API flow:

```text
features/tasks/router -> features/tasks/service -> features/tasks/repository -> database
```

Task listing uses an internal `TaskListQuery` schema to group:

- status filter,
- search query,
- limit,
- offset.

This keeps service/repository signatures cleaner and makes future task filters easier to add.

## Tests

Backend tests are under:

```text
services/backend/tests
```

Run tests:

```bash
make test
```

Current backend test coverage includes:

- health/version endpoints,
- user registration,
- login,
- current user,
- JWT validation,
- protected task endpoints,
- task ownership isolation,
- task filtering,
- task search,
- task pagination,
- task stats,
- task create/update/delete validation.

## Database note

Alembic migrations are intentionally postponed for the current local/MVP phase.

The backend currently initializes tables with SQLAlchemy `create_all()` during startup. This is acceptable for local development but not enough for real environments where data matters.

Before production-like data usage, add Alembic migrations and a safe migration/backfill workflow.
