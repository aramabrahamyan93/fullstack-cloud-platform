# Roadmap

## Current phase: platform foundation

Completed:

- FastAPI backend foundation
- Frontend foundation served by Nginx
- PostgreSQL integration
- Docker Compose local workflow
- Local smoke tests
- Backend tests
- Task API with validation
- Frontend integration with `/tasks` API
- Frontend `/api` proxy to backend
- Local Kubernetes with kind
- Helm chart deployment
- PostgreSQL readiness handling with init container
- Backend liveness and readiness health endpoints
- Kubernetes probes mapped to `/health/live` and `/health/ready`
- Helm-managed backend runtime configuration
- Configurable local naming through project name and release prefix
- One-command local validation
- ArgoCD GitOps templates made configurable
- Initial project documentation
- Dev ECR repositories made configurable and disabled for cost safety
- Terraform account variables split by stack-specific account folders
- Automatic ECR image publishing disabled while dev ECR repositories are disabled
- Cloud deploy Makefile environment chain fixed for `IMAGE_TAG`
- Local platform configurable access workflow implemented with `make local-platform-up`, refresh, doctor, status, links, and access-check targets
- Local monitoring and ArgoCD chart versions pinned for reproducible zero-state local installs
- Local platform scripts hardened to avoid custom SQL and keep schema ownership in the backend Alembic migration layer

## Next recommended steps

The next work should be split into focused branches. Do not combine documentation planning, local monitoring, local ArgoCD, and workspace domain refactors in one branch.

### 1. Roadmap and planning docs

Current branch:

```text
docs/roadmap-next-phase-planning
```

Goal:

- make the next phase explicit before implementation
- document the local ArgoCD/monitoring review scope
- document the workspace-first domain decision scope
- keep implementation branches small and reviewable

Expected output:

- updated roadmap
- next phase planning document
- clear branch sequence

### 2. Local ArgoCD and monitoring audit

Current audit result:

- backend `/metrics` support already exists
- backend Service has the expected `app: backend` label
- backend Service port is named `http`
- default local Helm render does not create `ServiceMonitor`
- `HELM_EXTRA_VALUES` now supports optional values overlays
- `helm/platform/values-local-monitoring.yaml` enables local `ServiceMonitor` rendering only when explicitly requested

Next implementation should install or validate the local monitoring stack before using the monitoring override with `helm-deploy`, because `ServiceMonitor` requires Prometheus Operator CRDs.

Recommended branch:

```text
feature/local-gitops-monitoring-audit
```

Review whether ArgoCD and monitoring should be enabled locally on kind, and define the minimum useful setup.

Planned review areas:

- local kind cluster and Helm state
- backend `/metrics` availability
- `ServiceMonitor` rendering and selector behavior
- local Prometheus/Grafana feasibility
- existing addon scripts and values
- what remains cloud-only
- whether local addons should be optional and disabled by default

Recommendation:

Start with monitoring before local ArgoCD. Monitoring provides immediate practical value and can validate backend metrics and ServiceMonitor wiring. Local ArgoCD should remain optional unless it clearly improves the development loop.

### 3. Minimal local monitoring stack

Status: implemented in `feature/local-monitoring-stack`.

Validated capabilities:

- local `kube-prometheus-stack` install through `make local-monitoring-up`
- Prometheus Operator, Grafana, kube-state-metrics, node-exporter, and Prometheus running in the `monitoring` namespace
- app deploy with `make local-k8s-deploy-monitoring`
- backend `ServiceMonitor` created in `fullstack-local`
- backend `/metrics` scraped by Prometheus
- Prometheus `up` query contains `job=backend`, `namespace=fullstack-local`, `service=backend`, value `1`

Default local validation remains unchanged and monitoring remains optional.

Recommended branch:

```text
feature/local-monitoring-stack
```

Goal:

Add an optional local monitoring preview for kind.

Expected capabilities:

- install local monitoring only when explicitly requested
- validate backend metrics exposure
- validate ServiceMonitor wiring
- provide port-forward or access instructions for Prometheus/Grafana
- document cleanup
- keep cloud resources untouched

### 4. Optional local ArgoCD preview

Status: implemented in `feature/local-argocd-preview`.

Recommended branch:

```text
feature/local-argocd-preview
```

Goal:

Evaluate ArgoCD locally as an optional GitOps learning/preview workflow.

Implemented:

- local ArgoCD installation through `make local-argocd-up`
- local ArgoCD status and cleanup targets
- browser access through `https://localhost:18443`
- local Application preview for `fullstack-local`
- local Application render/apply/status/delete targets
- resource tree visibility for backend, frontend, postgres, ingress, and `ServiceMonitor`

Validated behavior:

```text
Application: fullstack-local
Sync:        OutOfSync
Health:      Progressing
Source:      develop / helm/platform
```

`OutOfSync / Progressing` is expected because auto-sync is disabled. This keeps the local preview safe and observation-first.

Rules:

- do not make local ArgoCD mandatory for normal development
- do not slow down `make local-validate`
- do not rely on cloud-only secrets
- do not commit generated admin passwords
- keep cleanup available


### 4.5. Local platform configurable access hardening

Status: implemented in `fix/local-gitops-configurable-access`.

Validated capabilities:

- `make local-platform-up` builds a zero-state local platform from kind through monitoring, app deploy, ArgoCD preview, and access links
- `make local-platform-refresh` rebuilds/reloads local images and validates the app path
- `make local-platform-doctor` validates Helm releases, rollouts, `ServiceMonitor/backend`, Prometheus target health, and smoke tests
- `config/addons/local.env` keeps local choices minimal and pins addon chart versions
- local scripts clean failed or pending local Helm releases before retry
- local browser access is standardized through port-forward make targets
- no custom SQL is kept in local scripts

Design rule:

Local platform scripts must stay infrastructure/workflow-only. Database schema changes belong in Alembic migrations. Backend startup runs the safe migration runner by default.

### 5. Workspace-first product model

Recommended branch:

```text
docs/workspace-first-domain-plan
```

Review the current organization/workspace split and decide the next domain direction.

Current direction:

- one deployed platform can represent one customer/company
- workspace is the main in-product grouping concept
- organization-level code/knowledge should be preserved for possible future enterprise or multi-tenant extension
- public workspace IDs remain the browser/API route contract
- avoid large database renames until the migration plan is clear

Recommended approach:

- keep database tables named `organizations` for now
- keep `/organizations` API routes for compatibility for now
- keep `/workspaces` browser routes and workspace-first product language
- consider `/workspaces` API aliases later as a backward-compatible addition
- postpone DB/table renames until Alembic migrations are introduced

### 6. CI/CD hardening

Review GitHub Actions workflows and ensure local checks are represented in CI.

### 7. Logging and observability

Improve backend logging and document monitoring flow after the local monitoring audit.

Planned improvements:

- structured JSON logs
- request ID / correlation ID
- better metrics labels
- dashboard documentation

### 8. Authentication, users, and permissions

Continue strengthening auth, user, and permission boundaries after the workspace-first model decision.

### 9. Cloud validation

When needed, validate cloud deploy/teardown carefully with cost controls.

### 10. AI/GenAI capabilities

Future capabilities:

- assistant engine
- RAG
- vector database integration
- agent workflows
- company knowledge assistant
- job hunter assistant
- crypto assistant
- assistant builder MVP

## Medium-term plan

### SaaS foundation

- User accounts
- Organizations
- Roles and permissions
- Tenant-aware database structure
- Audit logs

### Production database management

Alembic migration foundation is now in place. Current capabilities:

- Alembic initialization under `services/backend`
- Initial migration for users, organizations, invitations, audit logs, and tasks
- Safe migration runner for fresh DBs and existing local schemas
- Make targets for migrate/current/history
- Backend startup migration flow controlled by `DB_RUN_MIGRATIONS_ON_STARTUP`

Planned follow-up work:

- Add migration authoring guidelines
- Add CI guard for migration drift/autogenerate checks
- Define production/cloud rollout rules for data-bearing environments

### Observability and operations

- JSON logs
- Correlation IDs
- Prometheus metrics expansion
- Grafana dashboards
- Alerts
- Runbooks

## Long-term vision: GenAI Service Platform

The long-term direction is to evolve the project into a GenAI service platform.

Potential capabilities:

- AI assistant per organization
- RAG document upload
- Vector database integration
- Chat history
- Agent tools
- Assistant templates
- Customer support bot
- Internal knowledge bot
- Document search bot
- Image/document processing
- Integration connectors
- Admin dashboard
- Subscription/billing-ready architecture

## Postponed items

- Alembic migration foundation is in place; future schema work should use new migration revisions.
- Cloud live validation should only be done when required.
- AWS resources should remain disabled/destroyed when not actively testing.
- Dev ECR repositories are disabled until image publishing is needed again.
