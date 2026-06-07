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
- backend `/version`
- backend `/metrics`
- frontend endpoint

Kubernetes smoke test:

```text
scripts/k8s-smoke-test.sh
```

Runs inside the cluster by executing from the backend deployment and checking Kubernetes services.

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
