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
make cloud-deploy ACCOUNT=... AWS_PROFILE=... IMAGE_TAG=...
  -> select account/environment
  -> run Terraform stack deployment
  -> configure kube context
  -> deploy addons
  -> deploy application through Helm/ArgoCD flow
```

`cloud-deploy` passes cloud parameters through the Makefile environment chain, including `ACCOUNT`, `AWS_PROFILE`, `AWS_REGION`, `PROJECT_NAME`, `RELEASE_PREFIX`, and `IMAGE_TAG`.

Cloud deploy and teardown must be used intentionally because they can create or destroy AWS resources.

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


## Local GitOps and monitoring planning

The repository contains ArgoCD and monitoring addon files, but local usage should be introduced carefully.

Current planning rule:

```text
local monitoring is reviewed first
local ArgoCD remains optional
cloud-only assumptions must not leak into local kind workflows
```

The next local audit should review:

- `addons/monitoring/values.yaml`
- `scripts/addons/monitoring.sh`
- `helm/platform/templates/backend-servicemonitor.yaml`
- `helm/platform/values-local.yaml`
- backend metrics availability
- `addons/argocd/values.yaml`
- `scripts/addons/argocd.sh`
- `scripts/deploy-addons.sh`

A local monitoring preview should be explicit and opt-in. It should not run automatically as part of the normal fast local validation until it is proven reliable and useful.

A local ArgoCD preview may be useful for learning and GitOps validation, but it should not be required for everyday local development.


## ECR publishing flow

Application image repositories are managed by the Terraform ECR stack.

ECR creation is controlled by:

```text
infra/config/ecr.tfvars
infra/accounts/<account>/ecr.tfvars
```

The shared default enables ECR repositories, while the current dev account disables them intentionally.

Because dev ECR repositories are currently disabled, automatic image publishing to ECR is disabled in `.github/workflows/publish-images.yml`. The workflow keeps `workflow_dispatch` so manual review-based execution remains possible after ECR repositories are re-enabled.

Before re-enabling automatic image publishing, first apply `enable_ecr_repositories = true` for the target account and verify that the backend/frontend repositories exist.
