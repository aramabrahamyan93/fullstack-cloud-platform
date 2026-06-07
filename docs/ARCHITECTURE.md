# Architecture

## High-level architecture

```text
Frontend (Nginx)
        |
        | HTTP
        v
Backend (FastAPI)
        |
        | SQLAlchemy / psycopg
        v
PostgreSQL
```

For local Kubernetes and cloud deployment, the components are deployed through Helm into a Kubernetes namespace.

```text
Helm chart
  -> backend ConfigMap
  -> backend Deployment
  -> backend Service
  -> frontend Deployment
  -> frontend Service
  -> PostgreSQL Secret, PVC, Deployment, Service for local mode
  -> Ingress resources
  -> ExternalSecret / SecretStore for external database mode
  -> ServiceMonitor for Prometheus monitoring
```

## Backend

The backend is implemented with FastAPI.

Main files:

```text
backend/app/main.py
backend/app/api/health.py
backend/app/api/version.py
backend/app/api/tasks.py
backend/app/core/config.py
backend/app/core/logging.py
backend/app/db/database.py
backend/app/db/init_db.py
backend/app/models/task.py
backend/app/schemas/task.py
backend/app/services/task_service.py
```

Current backend responsibilities:

- Provide health endpoint
- Provide version endpoint
- Provide metrics endpoint
- Initialize database tables on startup
- Provide initial task-related structure

Current tests:

```text
backend/tests/test_health.py
backend/tests/test_version.py
```

## Frontend

The frontend is currently a lightweight static frontend served by Nginx.

Main files:

```text
frontend/index.html
frontend/nginx.conf
frontend/Dockerfile
```

Current frontend responsibilities:

- Serve the main UI page
- Be reachable locally through Docker Compose
- Be reachable inside Kubernetes through the frontend service

## Database

The database is PostgreSQL.

In local Docker Compose:

```text
postgres service in docker-compose.yml
```

In local Kubernetes:

```text
postgres Secret
postgres PVC
postgres Deployment
postgres Service
```

In external/cloud mode, the backend receives `DATABASE_URL` from a Kubernetes Secret created through External Secrets.

## Docker Compose architecture

Docker Compose is used for fast local development.

It starts:

- backend
- frontend
- postgres

The Makefile calls Docker Compose with a project name:

```text
docker compose --env-file project.env -p $(PROJECT_NAME)
```

This keeps container, network, volume, and image naming aligned with `PROJECT_NAME`.

## Local Kubernetes architecture

Local Kubernetes uses kind.

The flow is:

```text
make local-k8s-up
  -> kind create cluster

make local-k8s-deploy
  -> build Docker images
  -> load images into kind
  -> helm upgrade --install

make local-k8s-wait
  -> wait for backend rollout
  -> wait for frontend rollout

make local-k8s-smoke-test
  -> exec into backend pod
  -> check backend endpoints
  -> check frontend service
```

The kind configuration intentionally avoids host port 80/443 mapping. The smoke test is in-cluster, so host port mappings are not required.

## Helm architecture

The Helm chart lives in:

```text
helm/platform
```

Important files:

```text
helm/platform/Chart.yaml
helm/platform/values.yaml
helm/platform/values-local.yaml
helm/platform/values-dev.yaml
helm/platform/values-staging.yaml
helm/platform/values-prod.yaml
helm/platform/templates/backend.yaml
helm/platform/templates/frontend.yaml
helm/platform/templates/postgres.yaml
helm/platform/templates/ingress.yaml
helm/platform/templates/external-secret.yaml
helm/platform/templates/secret-store.yaml
helm/platform/templates/backend-servicemonitor.yaml
```

The chart supports local mode and external database mode.

## Backend startup readiness

In local Kubernetes mode, the backend uses an init container called `wait-for-postgres`.

Purpose:

```text
Wait until PostgreSQL is ready before starting the backend container.
```

This prevents a startup race where FastAPI starts and tries to initialize the database before PostgreSQL is accepting connections.

## Monitoring integration

The Helm chart contains a backend `ServiceMonitor` template. This is intended for Prometheus Operator / kube-prometheus-stack integration.

The backend exposes `/metrics`, and the local Kubernetes smoke test validates that the metrics endpoint works.

## Cloud architecture

The cloud side is based on AWS and Terraform.

Major AWS components represented in the repository:

- ECR for Docker images
- EKS for Kubernetes
- RDS for PostgreSQL
- VPC networking
- IAM/GitHub OIDC
- External Secrets IRSA

Addon scripts install platform-level Kubernetes components such as:

- ArgoCD
- ingress-nginx
- external-secrets
- monitoring
- logging placeholder
- argo-rollouts placeholder
