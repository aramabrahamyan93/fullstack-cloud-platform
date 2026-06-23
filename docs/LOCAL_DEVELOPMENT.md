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

Local addon configuration is stored in:

```text
config/addons/local.env
```

Keep this file minimal. It contains only local choices, not derived names. Current local choices are:

```env
ENABLE_ARGOCD=true
ENABLE_ARGOCD_APPLICATION=true
ENABLE_MONITORING=true
MONITORING_CHART_VERSION=86.3.2
ARGOCD_CHART_VERSION=9.6.0
ARGOCD_TARGET_REVISION=develop
APP_ACCESS_LOCAL_PORT=18081
ARGOCD_LOCAL_PORT=18443
PROMETHEUS_LOCAL_PORT=19091
GRAFANA_LOCAL_PORT=13000
```

Namespaces, release names, chart paths, value files, and service names are derived by `scripts/local-common.sh`. Local chart versions are pinned so a fresh zero-state install is reproducible and does not silently pick up a newer Helm chart.

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

Use the standard kind/Helm validation when you only need the app stack:

```bash
make local-k8s-validate
```

Use the full local platform workflow when you want the app, monitoring, ArgoCD preview, browser access helpers, Prometheus target validation, and smoke tests together:

```bash
make local-platform-up
```

After app code changes, refresh the running local platform without deleting the cluster:

```bash
make local-platform-refresh
```

Run operational health checks without rebuilding images:

```bash
make local-platform-doctor
```

Show current resources and access links:

```bash
make local-platform-status
make local-platform-links
```

The full local platform workflow performs these responsibilities only:

1. create or reuse the kind cluster
2. install pinned local monitoring when enabled
3. build and load backend/frontend images into kind
4. deploy the app with the local monitoring Helm override
5. restart backend/frontend deployments so `latest` images are used
6. wait for the backend Prometheus target to be `up`
7. run the local Kubernetes smoke test
8. install pinned local ArgoCD when enabled
9. apply the local ArgoCD Application preview
10. print browser access commands

Local platform scripts must not contain custom SQL. Database schema changes belong to the application/migration layer. If a local database was created with an older schema while Alembic is still postponed, reset the local database or cluster instead of adding SQL to platform scripts.

## Optional local monitoring preview

The backend exposes `/metrics`, and the Helm chart contains a `ServiceMonitor` template. Local Kubernetes keeps that `ServiceMonitor` disabled by default because a fresh kind cluster does not include Prometheus Operator CRDs.

Use the optional local monitoring stack only when you want to validate observability locally:

```bash
make local-monitoring-up
make local-k8s-deploy-monitoring
make local-monitoring-status
```

The flow is:

1. `make local-monitoring-up` installs `kube-prometheus-stack` into the `monitoring` namespace.
2. Prometheus Operator installs the required CRDs, including `ServiceMonitor`.
3. `make local-k8s-deploy-monitoring` upgrades the local app release with `helm/platform/values-local-monitoring.yaml`.
4. Helm creates `ServiceMonitor/backend` in the `fullstack-local` namespace.
5. Prometheus discovers and scrapes `http://backend:8000/metrics` through the backend service named port `http`.

Validated result:

```text
job="backend"
namespace="fullstack-local"
service="backend"
up = 1
```

The local monitoring install uses a pinned `kube-prometheus-stack` chart version from `config/addons/local.env`. If a previous local Helm install is `failed` or `pending-*`, the local installer cleans it before retrying.

Open Prometheus and Grafana with:

```bash
make local-prometheus-port-forward
make local-grafana-port-forward
```

Browser URLs:

```text
Prometheus: http://localhost:19091
Grafana:    http://localhost:13000
```

Useful checks:

```bash
make local-monitoring-status
kubectl get servicemonitor backend -n fullstack-local
make local-k8s-smoke-test
```

Cleanup is local-only:

```bash
make local-monitoring-down
```

The optional local monitoring override is:

```text
helm/platform/values-local-monitoring.yaml
```

Render validation:

```bash
make helm-render ENV=local HELM_EXTRA_VALUES="helm/platform/values-local-monitoring.yaml"
```

Expected behavior:

- normal `make helm-render ENV=local` does not render `ServiceMonitor`
- override render includes backend `ServiceMonitor`
- the metrics path remains `/metrics`
- the backend service selector remains `app: backend`
- the backend service port remains named `http`

Do not make local monitoring part of the default local validation flow. Normal local development should continue to work without monitoring installed.

## Optional local ArgoCD preview

Local ArgoCD is optional. Use it when you want to inspect the local Helm deployment through a GitOps UI and learn how ArgoCD sees Kubernetes resources.

Install ArgoCD locally:

```bash
make local-argocd-up
make local-argocd-status
```

The local installer uses:

```text
scripts/local-argocd.sh
addons/argocd/values.yaml
```

It does not require `ACCOUNT`, `AWS_PROFILE`, External Secrets, or AWS account metadata.

The local ArgoCD install uses a pinned `argo-cd` chart version from `config/addons/local.env`. If a previous local Helm install is `failed` or `pending-*`, the local installer cleans it before retrying.

Open ArgoCD in the browser:

```bash
make local-argocd-port-forward
```

Browser URL:

```text
https://localhost:18443
```

Login:

```text
username: admin
```

Password command:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d
```

Do not commit or document the generated password.

Apply the local Application preview:

```bash
make local-argocd-app-render
make local-argocd-app-apply
make local-argocd-app-status
```

The local Application template is:

```text
addons/argocd/applications/local-app.yaml.tpl
```

Validated behavior:

- the ArgoCD UI shows `fullstack-local`
- the resource tree includes backend, frontend, postgres, ingress, and backend `ServiceMonitor`
- the application points to `develop` and `helm/platform`
- `OutOfSync / Progressing` is expected before manual sync
- auto-sync is not enabled

This keeps local ArgoCD safe as a preview. It lets ArgoCD observe and compare the desired state without automatically changing local resources.

Cleanup:

```bash
make local-argocd-app-delete
make local-argocd-down
```

Keep local ArgoCD out of the default fast local validation path unless there is a clear reason to include it.


## Local browser access

The local app, ArgoCD, Prometheus, and Grafana services are ClusterIP services. Keep these commands open in separate terminals when you want browser access:

```bash
make local-app-port-forward
make local-argocd-port-forward
make local-prometheus-port-forward
make local-grafana-port-forward
```

Then open:

```text
App:        http://localhost:18081
ArgoCD:     https://localhost:18443
Prometheus: http://localhost:19091
Grafana:    http://localhost:13000
```

Check all browser links after the port-forward commands are running:

```bash
make local-platform-access-check
```

If a link is missing, the access check prints the exact port-forward command to start.

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

### Local platform browser link does not open

The app, ArgoCD, Prometheus, and Grafana browser links require port-forward commands. Run:

```bash
make local-platform-links
make local-platform-access-check
```

The access check tells you which port-forward command is missing.

### Local monitoring install fails after an interrupted install

The local monitoring script pins the chart version and cleans failed or pending Helm releases before retry. Run:

```bash
make local-monitoring-up
```

If the namespace is still stuck from an interrupted local run, remove the local platform and start again:

```bash
make local-platform-down
make local-platform-up
```

### Local database schema is stale

Do not add custom SQL to local platform scripts. The local platform scripts do not own database schema. During the current MVP phase, Alembic migrations are postponed and SQLAlchemy `create_all()` only creates missing tables. If an old local database schema causes failures, reset the local database or recreate the local cluster.
