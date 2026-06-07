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

## Next recommended steps

### 1. Documentation maintenance

Keep README short and maintain detailed docs under `docs/`.

### 2. API foundation

Improve the tasks API:

- update task
- delete task
- task status transition
- pagination
- filtering

### 3. Logging and observability

Improve backend logging and document monitoring flow.

Planned improvements:

- structured JSON logs
- request ID / correlation ID
- better metrics labels
- dashboard documentation

### 4. CI/CD hardening

Review GitHub Actions workflows and ensure all local checks are represented in CI.

### 5. Authentication and users

Add auth foundation for future SaaS and platform users.

### 6. Organizations and multi-tenancy

Add organization model and tenant-aware application structure.

### 7. Cloud validation

When needed, validate cloud deploy/teardown carefully with cost controls.

### 8. AI/GenAI capabilities

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

Alembic migrations are postponed for now, but should be introduced before the platform becomes more data-heavy.

Planned migration work:

- Alembic initialization
- First migration for tasks/users/organizations
- Migration commands in Makefile
- Migration workflow for Kubernetes/cloud

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

- Alembic migrations are postponed for now.
- Cloud live validation should only be done when required.
- AWS resources should remain disabled/destroyed when not actively testing.
