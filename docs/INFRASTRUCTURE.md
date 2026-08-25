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

Account configuration is split by AWS account and Terraform stack:

```text
infra/accounts/<account>/common.tfvars
infra/accounts/<account>/bootstrap.tfvars
infra/accounts/<account>/ecr.tfvars
infra/accounts/<account>/platform.tfvars
```

Current account folders:

```text
infra/accounts/dev-859981975099/
infra/accounts/staging-859981975099/
```

`common.tfvars` contains values shared by all stacks, such as `environment` and `account_id`.

Stack-specific files contain only values used by that stack. This avoids passing platform-only variables into the ECR or bootstrap stacks and keeps Terraform plans free from undeclared-variable warnings.

The Terraform helper script still supports the old legacy file shape as a fallback:

```text
infra/accounts/<account>.tfvars
```

New account configuration should use the folder-based structure.

## Global configuration

Global and service-level configuration lives in:

```text
infra/config/global.tfvars
infra/config/github.tfvars
infra/config/platform.tfvars
infra/config/services.tfvars
infra/config/ecr.tfvars
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

ECR repository creation is controlled by:

```text
infra/config/ecr.tfvars
infra/accounts/<account>/ecr.tfvars
```

The shared default is `enable_ecr_repositories = true`. Account-specific stack config can override it.

For the current dev account, ECR repositories are intentionally disabled:

```text
infra/accounts/dev-859981975099/ecr.tfvars
```

That file sets:

```hcl
enable_ecr_repositories = false
```

Before enabling or disabling ECR repositories, always run and review:

```bash
make tf-plan STACK=ecr ACCOUNT=<account> AWS_PROFILE=<profile> AWS_REGION=<region>
```

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

The dev account currently keeps cost-generating runtime infrastructure disabled. ECR repositories are also disabled in dev until image publishing is needed again.

## Terraform state note

Terraform state files and `.terraform` directories should not normally be committed to Git. They should be ignored or removed from Git tracking if accidentally tracked.
