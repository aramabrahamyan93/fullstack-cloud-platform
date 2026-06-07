# Fullstack Cloud Platform

Fullstack Cloud Platform is a local-first cloud platform project built with FastAPI, a frontend served by Nginx, PostgreSQL, Docker Compose, Kubernetes, Helm, Terraform, and AWS deployment tooling.

The project is currently focused on building a clean foundation for a production-ready platform: local development, local Kubernetes validation, cloud infrastructure, GitOps deployment, monitoring, and later AI/GenAI service capabilities.

## Quick start

Show all available commands:

```bash
make help
```

Run the complete local validation:

```bash
make validate-local-all
```

This runs both the Docker Compose validation and the local Kubernetes validation.

## Main local workflows

Fast Docker Compose validation:

```bash
make local-validate
```

Local Kubernetes and Helm validation with kind:

```bash
make local-k8s-validate
```

## Documentation

Detailed documentation is available in the `docs/` directory:

- [Project overview](docs/PROJECT_OVERVIEW.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Project structure](docs/PROJECT_STRUCTURE.md)
- [Local development](docs/LOCAL_DEVELOPMENT.md)
- [Infrastructure](docs/INFRASTRUCTURE.md)
- [Deployment flow](docs/DEPLOYMENT_FLOW.md)
- [CI/CD](docs/CI_CD.md)
- [Operations](docs/OPERATIONS.md)
- [Roadmap](docs/ROADMAP.md)

## Current validated status

The project currently has a working local Docker Compose workflow and a working local Kubernetes workflow.

The full validation command has been tested successfully:

```bash
make validate-local-all
```

Current validated capabilities:

- FastAPI backend starts successfully
- PostgreSQL starts and becomes healthy
- Backend initializes database tables on startup
- Backend exposes `/health`, `/health/live`, `/health/ready`, `/version`, `/metrics`, and `/tasks`
- Frontend is served by Nginx
- Frontend connects to the backend through the `/api` Nginx proxy
- Frontend can list and create tasks through the backend API
- Docker Compose smoke tests validate backend, frontend, frontend API proxy, and task creation
- Local Kubernetes smoke tests validate backend, frontend service, frontend API proxy, and task creation
- Backend tests pass successfully
- Helm chart renders and deploys successfully in local kind Kubernetes

## AWS cost note

Local Docker Compose and local kind workflows do not create AWS resources.

AWS resources such as EKS, RDS, NAT Gateway, Load Balancers, ECR, and related services may generate cost. Enable them only when needed for testing, and destroy or disable them after validation if they are not required.
