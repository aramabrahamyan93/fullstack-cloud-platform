# Roadmap

## Current phase: platform foundation

Completed or in progress:

- FastAPI backend foundation
- Frontend foundation
- PostgreSQL integration
- Docker Compose local workflow
- Local smoke tests
- Backend tests
- Local Kubernetes with kind
- Helm chart deployment
- PostgreSQL readiness handling with init container
- Configurable local naming through project name and release prefix
- One-command local validation
- Initial project documentation

## Next recommended steps

### 1. Project structure cleanup

Review tracked files and remove generated/local-only files from Git where needed, especially Terraform state and `.terraform` directories.

### 2. Documentation improvement

Keep README short and maintain detailed docs under `docs/`.

### 3. Logging and observability

Improve backend logging and document monitoring flow.

### 4. CI/CD cleanup

Review GitHub Actions workflows and remove or consolidate outdated workflows.

### 5. Cloud validation

When needed, validate cloud deploy/teardown carefully with cost controls.

### 6. Authentication and users

Add auth foundation for future SaaS and platform users.

### 7. Organizations and multi-tenancy

Add organization model and tenant-aware application structure.

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

## Postponed items

- Alembic migrations are postponed for now.
- Cloud live validation should only be done when required.
- AWS resources should remain disabled/destroyed when not actively testing.
