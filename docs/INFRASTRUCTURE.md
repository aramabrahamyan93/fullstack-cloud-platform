# Infrastructure

## Overview

The repository contains Terraform infrastructure for AWS cloud deployment and scripts for installing Kubernetes platform addons.

The infrastructure is organized into:

```text
infra/accounts
infra/config
infra/environments
infra/modules
infra/stacks
```

## AWS region

The current default AWS region is configured as:

```text
eu-central-1
```

## Account configuration

Account-specific files:

```text
infra/accounts/dev-859981975099.tfvars
infra/accounts/staging-859981975099.tfvars
```

These files are used to select account/environment-specific values.

## Global configuration

Global and service-level configuration lives in:

```text
infra/config/global.tfvars
infra/config/github.tfvars
infra/config/platform.tfvars
infra/config/services.tfvars
infra/config/addons.tfvars
```

## Terraform modules

### VPC

```text
infra/modules/vpc
```

Responsible for AWS networking foundation.

### EKS

```text
infra/modules/eks
```

Responsible for Kubernetes cluster provisioning.

### RDS

```text
infra/modules/rds
```

Responsible for managed PostgreSQL database provisioning.

### ECR

```text
infra/modules/ecr
```

Responsible for Docker image repositories.

### IAM GitHub OIDC

```text
infra/modules/iam-github-oidc
```

Responsible for allowing GitHub Actions to authenticate to AWS using OIDC.

### External Secrets IRSA

```text
infra/modules/external-secrets-irsa
```

Responsible for IAM roles used by External Secrets to read AWS secrets.

## Terraform stacks

### Bootstrap

```text
infra/stacks/bootstrap
```

Used for foundational Terraform state/backend or bootstrap resources.

### ECR

```text
infra/stacks/ecr
```

Used for creating ECR repositories.

### Platform

```text
infra/stacks/platform
```

Used for main platform resources such as VPC, EKS, RDS, and related integrations.

## Terraform commands

Makefile targets:

```bash
make tf-init STACK=platform
make tf-plan STACK=platform
make tf-apply STACK=platform
make tf-destroy STACK=platform
make tf-validate STACK=platform
```

## Cloud cost warning

AWS resources can generate cost. Be careful with:

- EKS
- RDS
- NAT Gateway
- Load Balancers
- ECR storage
- CloudWatch logs

Before enabling cloud resources, verify that the environment is correct. After tests, destroy or disable unused resources.

## Terraform state note

Terraform state files and `.terraform` directories should not normally be committed to Git. They should be ignored or removed from Git tracking if accidentally tracked.
