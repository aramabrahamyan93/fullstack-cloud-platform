# Deployment flow

## Local deployment flow

### Docker Compose

```text
make local-validate
  -> docker compose down
  -> docker compose down -v
  -> docker compose build
  -> docker compose up -d
  -> local smoke test
  -> pytest
  -> docker compose down
```

### Local Kubernetes

```text
make local-k8s-validate
  -> delete kind cluster if exists
  -> create kind cluster
  -> build backend/frontend images
  -> load images into kind
  -> helm upgrade --install
  -> wait for backend/frontend rollout
  -> run Kubernetes smoke test
  -> show Kubernetes status
```

## Helm deployment flow

```text
make helm-deploy
  -> helm upgrade --install
  -> apply environment values file
  -> apply --set values from Makefile
```

Important values passed from Makefile:

```text
namespace
PROJECT_NAME
global.domain
global.awsAccountId
global.awsRegion
```

Backend runtime config is rendered into the `backend-config` ConfigMap.

Important backend config values managed through Helm:

```text
APP_ENV
APP_NAME
APP_VERSION
SQL_ECHO
DB_INIT_RETRIES
DB_INIT_RETRY_DELAY_SECONDS
DATABASE_URL
```

In local database mode, Helm renders `DATABASE_URL` from PostgreSQL values.

In external database mode, the backend reads `DATABASE_URL` from a Kubernetes Secret.

## Health and probe deployment flow

Backend health endpoints are mapped to Kubernetes probes:

```text
startupProbe   -> /health/live
livenessProbe  -> /health/live
readinessProbe -> /health/ready
```

The readiness endpoint checks database connectivity. This helps Kubernetes route traffic only to backend pods that can reach the database.

## Cloud deployment flow

Cloud deployment is script-based and uses Terraform, kubectl, Helm, and addon deployment scripts.

Important scripts:

```text
scripts/cloud-deploy.sh
scripts/cloud-teardown.sh
scripts/deploy-addons.sh
scripts/terraform.sh
scripts/docker-build-push.sh
```

Expected high-level cloud flow:

```text
make cloud-deploy ACCOUNT=... AWS_PROFILE=...
  -> select account/environment
  -> run Terraform stack deployment
  -> configure kube context
  -> deploy addons
  -> deploy application through Helm/ArgoCD flow
```

## Addon deployment flow

Addon script:

```text
scripts/deploy-addons.sh
```

Addon modules:

```text
scripts/addons/common.sh
scripts/addons/argocd.sh
scripts/addons/external-secrets.sh
scripts/addons/ingress-nginx.sh
scripts/addons/monitoring.sh
scripts/addons/logging.sh
scripts/addons/argo-rollouts.sh
```

Addon configuration:

```text
config/addons/dev.env
config/addons/staging.env
```

Supported addon areas:

- ArgoCD
- ingress-nginx
- external-secrets
- monitoring
- logging placeholder
- argo-rollouts placeholder

## GitOps direction

ArgoCD application template:

```text
addons/argocd/applications/app.yaml.tpl
```

The intended cloud deployment model is GitOps-oriented: Kubernetes resources are described in Git, and ArgoCD syncs the desired state to the cluster.

The ArgoCD application template is configurable through:

```text
PROJECT_NAME
RELEASE_PREFIX
ENVIRONMENT
GIT_REPO_URL
GIT_TARGET_REVISION
AWS_ACCOUNT_ID
AWS_REGION
```

This avoids hardcoded release names and namespaces.
