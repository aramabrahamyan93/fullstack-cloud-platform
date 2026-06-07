# Project structure

## Root files

```text
Makefile
project.env
docker-compose.yml
README.md
PROJECT_DOCUMENTATION.md
services.json
.github/
backend/
frontend/
helm/
k8s/
infra/
addons/
scripts/
config/
```

## Backend

```text
backend/
  Dockerfile
  requirements.txt
  README.md
  app/
    main.py
    api/
      health.py
      version.py
      tasks.py
    core/
      config.py
      logging.py
    db/
      database.py
      dependencies.py
      init_db.py
    models/
      task.py
    schemas/
      task.py
    services/
      task_service.py
  tests/
    test_health.py
    test_version.py
```

The backend contains the FastAPI application, API routes, database initialization, SQLAlchemy models, schemas, services, and tests.

## Frontend

```text
frontend/
  Dockerfile
  index.html
  nginx.conf
```

The frontend is currently a static Nginx-based UI.

## Helm

```text
helm/platform/
  Chart.yaml
  values.yaml
  values-local.yaml
  values-dev.yaml
  values-staging.yaml
  values-prod.yaml
  templates/
    _helpers.tpl
    backend.yaml
    frontend.yaml
    postgres.yaml
    ingress.yaml
    external-secret.yaml
    secret-store.yaml
    backend-servicemonitor.yaml
```

The Helm chart defines how the application is deployed to Kubernetes.

## Kubernetes local config

```text
k8s/kind-config.yaml
```

This file defines the local kind cluster.

## Infrastructure

```text
infra/
  accounts/
  config/
  environments/
  modules/
  stacks/
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
