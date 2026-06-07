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

The project currently has a working local Docker Compose workflow and a working local Kubernetes workflow. The full validation command `make validate-local-all` has been tested successfully with backend, frontend, PostgreSQL, smoke tests, backend tests, kind, Helm deployment, and Kubernetes smoke tests.

## AWS cost note

Local Docker Compose and local kind workflows do not create AWS resources.

AWS resources such as EKS, RDS, NAT Gateway, Load Balancers, ECR, and related services may generate cost. Enable them only when needed for testing, and destroy or disable them after validation if they are not required.
