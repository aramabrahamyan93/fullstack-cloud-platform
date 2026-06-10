# Project Structure

This document describes the current repository structure of the Fullstack Cloud Platform project.

The project is organized as a fullstack cloud-native application with:

- FastAPI backend
- React frontend
- PostgreSQL database
- Docker Compose local development
- Kubernetes and Helm deployment
- Terraform-based infrastructure
- GitHub Actions CI/CD
- operational documentation under `docs/`

## Root structure

```text
.
├── .github/
├── addons/
├── apps/
├── config/
├── docs/
├── helm/
├── infra/
├── k8s/
├── scripts/
├── services/
├── shared/
├── docker-compose.yml
├── Makefile
├── project.env
├── README.md
└── services.json
```

## Backend

Backend code lives under:

```text
services/backend/
```

Current backend application structure:

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

### Backend responsibilities

`app/main.py`

Application entrypoint. Creates the FastAPI application and registers middleware, exception handlers, and the main API router.

`app/api/`

Application-level API wiring and system endpoints.

- `router.py` aggregates all routers.
- `health.py` provides health, readiness, and liveness endpoints.
- `version.py` provides version information.
- `exception_handlers.py` registers centralized exception handling.

`app/core/`

Shared backend foundation.

- configuration
- logging
- custom application errors
- security helpers

`app/db/`

Database setup and dependency wiring.

- SQLAlchemy engine/session setup
- database dependencies
- local database initialization helpers

`app/features/`

Feature-based backend modules.

Each feature owns its related router, schemas, service logic, repository logic, models, and constants where applicable.

Current backend features:

- `auth` — registration, login, current-user endpoint, authentication service, auth schemas
- `users` — user model and user repository
- `tasks` — task model, task API, task service, task repository, task schemas, task constants

### Backend architecture rule

Do not reintroduce broad root-level backend folders for feature-specific code, such as:

```text
services/backend/app/models
services/backend/app/repositories
services/backend/app/schemas
services/backend/app/services
```

Feature-specific backend code should live under:

```text
services/backend/app/features/<feature-name>/
```

## Frontend

Frontend code lives under:

```text
apps/frontend/
```

Current frontend source structure:

```text
apps/frontend/src/
├── app/
│   ├── App.tsx
│   └── config.ts
├── features/
│   ├── auth/
│   │   ├── api.ts
│   │   ├── components/
│   │   │   └── AuthPanel.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── tokenStorage.ts
│   │   └── types.ts
│   ├── system/
│   │   └── api.ts
│   └── tasks/
│       ├── api.ts
│       ├── components/
│       │   ├── TaskDashboard.tsx
│       │   ├── TaskForm.tsx
│       │   ├── TaskItem.tsx
│       │   └── TaskList.tsx
│       ├── hooks/
│       │   └── useTasks.ts
│       └── types.ts
├── shared/
│   ├── api/
│   │   ├── client.ts
│   │   └── errors.ts
│   └── components/
│       ├── Message.tsx
│       └── SystemStatus.tsx
├── main.tsx
└── styles.css
```

### Frontend responsibilities

`src/main.tsx`

React/Vite entrypoint.

`src/app/`

Application shell and frontend configuration.

- `App.tsx` composes the main application UI.
- `config.ts` contains frontend runtime configuration.

`src/features/`

Feature-based frontend modules.

Current frontend features:

- `auth` — auth API calls, token storage, auth hook, auth UI, auth types
- `tasks` — task API calls, task hook, task UI components, task types
- `system` — system/health/version API calls

`src/shared/`

Reusable frontend foundation.

- `shared/api/client.ts` — generic API client
- `shared/api/errors.ts` — generic API error handling
- `shared/components/Message.tsx` — reusable message component
- `shared/components/SystemStatus.tsx` — reusable system status component

### Frontend architecture rule

Do not reintroduce broad root-level frontend folders for feature-specific code, such as:

```text
apps/frontend/src/api
apps/frontend/src/auth
apps/frontend/src/components
apps/frontend/src/tasks
apps/frontend/src/types
```

Feature-specific frontend code should live under:

```text
apps/frontend/src/features/<feature-name>/
```

Reusable frontend code should live under:

```text
apps/frontend/src/shared/
```

Application composition should live under:

```text
apps/frontend/src/app/
```

## Helm

```text
helm/platform/
├── Chart.yaml
├── values.yaml
├── values-local.yaml
├── values-dev.yaml
├── values-staging.yaml
├── values-prod.yaml
└── templates/
    ├── _helpers.tpl
    ├── backend.yaml
    ├── frontend.yaml
    ├── postgres.yaml
    ├── ingress.yaml
    ├── external-secret.yaml
    ├── secret-store.yaml
    └── backend-servicemonitor.yaml
```

The Helm chart defines how the application is deployed to Kubernetes.

## Kubernetes local config

```text
k8s/kind-config.yaml
```

This file defines the local kind cluster configuration.

## Infrastructure

```text
infra/
├── accounts/
├── config/
├── environments/
├── modules/
└── stacks/
```

Infrastructure is organized around Terraform modules and stack wrappers.

## Terraform modules

```text
infra/modules/ecr
infra/modules/eks
infra/modules/external-secrets-irsa
infra/modules/iam-github-oidc
infra/modules/rds
infra/modules/vpc
```

These modules represent reusable AWS infrastructure blocks.

## Terraform stacks

```text
infra/stacks/bootstrap
infra/stacks/ecr
infra/stacks/platform
```

Stacks combine modules into deployable infrastructure units.

## Addons

```text
addons/argocd
addons/external-secrets
addons/ingress-nginx
addons/monitoring
```

Addon configuration is used by scripts to install Kubernetes platform components.

## Scripts

```text
scripts/cloud-deploy.sh
scripts/cloud-teardown.sh
scripts/deploy-addons.sh
scripts/terraform.sh
scripts/docker-build-push.sh
scripts/local-smoke-test.sh
scripts/k8s-smoke-test.sh
scripts/addons/*.sh
scripts/github-actions/*.sh
scripts/github-actions/*.py
```

Scripts automate local validation, cloud deployment, teardown, addon installation, and GitHub Actions helpers.

## GitHub Actions

```text
.github/workflows/auto-deploy-dev.yml
.github/workflows/ci.yml
.github/workflows/deploy.yml
.github/workflows/docker-build-push.yml
.github/workflows/fullstack-ci.yml
.github/workflows/publish-images.yml
.github/workflows/terraform-ci.yml
```

These workflows support CI, Docker image publishing, Terraform validation, and deployment automation.

## Architecture direction

The current codebase follows a SaaS-ready modular monolith direction.

Main rules:

- Backend business code should live under `app/features/<feature-name>/`.
- Frontend feature code should live under `src/features/<feature-name>/`.
- Shared reusable frontend code should live under `src/shared/`.
- Application composition should live under `src/app/`.
- Generic backend foundation should live under `app/core/`, `app/db/`, and `app/api/`.
- Keep feature boundaries clear.
- Avoid hardcoded business values when constants/config are more appropriate.
- Avoid overengineering before the project actually needs separate services.
- Extract microservices later only when there is a real scaling, ownership, isolation, or deployment reason.
