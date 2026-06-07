# Project overview

## Purpose

Fullstack Cloud Platform is a learning and implementation project for building a production-style cloud application platform from the ground up.

The current foundation includes:

- FastAPI backend
- Frontend served by Nginx
- PostgreSQL database
- Docker Compose local development
- Local Kubernetes with kind
- Helm chart deployment
- Terraform-based AWS infrastructure
- Addon installation scripts for Kubernetes platform components
- GitHub Actions workflows for CI/CD and image publishing

The long-term direction is to evolve the platform into a GenAI service platform with authentication, organizations, multi-tenancy, assistant services, RAG, agents, monitoring, logging, and SaaS/admin capabilities.

## Current project goal

The current phase is focused on platform foundation:

1. Make local development reliable.
2. Make local Kubernetes validation reliable.
3. Keep naming configurable through `PROJECT_NAME` and `RELEASE_PREFIX`.
4. Document the project clearly.
5. Prepare the codebase for future cloud and AI integrations.

## Current status

Validated locally:

- Docker Compose build and run
- Local smoke test
- Backend tests with pytest
- Local kind cluster creation
- Docker image loading into kind
- Helm deployment
- Backend and frontend rollout checks
- Kubernetes smoke test
- PostgreSQL startup readiness handling

The command below is the main full local validation command:

```bash
make validate-local-all
```

## Key configuration

The main project configuration file is:

```text
project.env
```

Important values:

```env
PROJECT_NAME=fullstack-cloud-platform
AWS_REGION=eu-central-1
RELEASE_PREFIX=fullstack
```

These values are used by Makefile, Docker Compose, Helm, and local Kubernetes workflows.

## High-level workflow

```text
Developer
  -> Makefile
    -> Docker Compose workflow
    -> local kind/Kubernetes workflow
    -> Helm workflow
    -> Terraform/AWS workflow
    -> addon deployment workflow
```

## Important design decisions

- Local development must work without AWS.
- Local Kubernetes validation must not depend on host port 80/443.
- Docker image names must be driven by `PROJECT_NAME`.
- Kubernetes namespace and Helm release names must be driven by `RELEASE_PREFIX` and environment.
- Backend startup must wait for local PostgreSQL readiness in Kubernetes.
- Cloud resources should be enabled intentionally because they may generate cost.
