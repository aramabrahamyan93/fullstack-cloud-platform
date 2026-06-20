# Local development

## Requirements

Install:

- Docker
- Docker Compose
- make
- kind
- kubectl
- Helm

On Windows, Git Bash is currently used for running the commands.

## Configuration

The main local configuration is:

```text
project.env
```

Example:

```env
PROJECT_NAME=fullstack-cloud-platform
AWS_REGION=eu-central-1
RELEASE_PREFIX=fullstack
```

Derived values:

```text
ENV=local
K8S_NAMESPACE=$(RELEASE_PREFIX)-$(ENV)
KIND_CLUSTER=$(PROJECT_NAME)
HELM_RELEASE=$(RELEASE_PREFIX)-$(ENV)
```

Backend runtime configuration for Docker Compose is stored in:

```text
.env.local
```

Important backend runtime values:

```text
APP_ENV
APP_NAME
APP_VERSION
DATABASE_URL
SQL_ECHO
DB_INIT_RETRIES
DB_INIT_RETRY_DELAY_SECONDS
```

## Show commands

```bash
make help
```

## Docker Compose workflow

Run full Docker Compose validation:

```bash
make local-validate
```

This runs:

```text
local-down
local-clean
local-build
local-up
local-smoke-test
local-test
local-down
```

Use this workflow for:

- backend code changes
- frontend code changes
- local DB checks
- quick smoke testing
- pytest validation

## Local Kubernetes workflow

## Optional local monitoring preview

The backend exposes `/metrics`, and the Helm chart contains a `ServiceMonitor` template. Local Kubernetes keeps that `ServiceMonitor` disabled by default because a fresh kind cluster does not include Prometheus Operator CRDs.

The optional local monitoring override is:

```text
helm/platform/values-local-monitoring.yaml
```

Use it for render validation only until the monitoring stack is installed:

```bash
make helm-render ENV=local HELM_EXTRA_VALUES="helm/platform/values-local-monitoring.yaml"
```

Expected behavior:

- normal `make helm-render ENV=local` does not render `ServiceMonitor`
- override render includes backend `ServiceMonitor`
- the metrics path remains `/metrics`
- the backend service selector remains `app: backend`
- the backend service port remains named `http`

Do not make local monitoring part of the default local validation flow until it is proven reliable and useful. Normal local development should continue to work without monitoring installed.

Run full kind/Kubernetes validation:

```bash
make local-k8s-validate
```

This runs:

```text
local-k8s-down
local-k8s-up
local-k8s-deploy
local-k8s-wait
local-k8s-smoke-test
local-k8s-status
```

Use this workflow for:

- Helm chart changes
- Kubernetes deployment changes
- service changes
- ingress changes
- probes
- init containers
- PVC/database Kubernetes changes

## Full local validation

Before pushing larger workflow or infrastructure changes, run:

```bash
make validate-local-all
```

This runs both Docker Compose and local Kubernetes validation.

## Smoke tests

Docker Compose smoke test:

```text
scripts/local-smoke-test.sh
```

Checks:

- backend `/health`
- backend `/health/live`
- backend `/health/ready`
- backend `/version`
- backend `/metrics`
- backend `/tasks`
- frontend root endpoint
- frontend `/api/health` proxy
- frontend `/api/health/live` proxy
- frontend `/api/health/ready` proxy
- frontend `/api/tasks` proxy
- frontend `/api/tasks` task creation through proxy

Kubernetes smoke test:

```text
scripts/k8s-smoke-test.sh
```

The Kubernetes smoke test runs inside the cluster by executing curl commands from the backend deployment.

Checks:

- backend service endpoints
- frontend service endpoint
- frontend `/api` proxy to backend
- task creation through the frontend service proxy

## Common commands

```bash
make local-build
make local-up
make local-smoke-test
make local-test
make local-down
make local-clean
```

```bash
make local-k8s-up
make local-k8s-deploy
make local-k8s-wait
make local-k8s-smoke-test
make local-k8s-status
make local-k8s-down
```

## Troubleshooting

### Backend not ready immediately

The local smoke test has retry logic. It may show one or two attempts with `status=000` while the backend is starting. This is acceptable if the test succeeds after retries.

### kind port 80 conflict

The kind config should not map host ports 80/443. The Kubernetes smoke test is in-cluster, so host port mappings are not required.

### Backend restarts in Kubernetes

The backend should not restart because of PostgreSQL readiness. In local Kubernetes mode, the backend waits for PostgreSQL through an init container.

### Frontend API proxy fails

The frontend Nginx config proxies `/api/*` requests to the backend service. If frontend proxy smoke tests fail, check:

```text
frontend/nginx.conf
frontend service DNS inside Kubernetes
backend service availability
```
