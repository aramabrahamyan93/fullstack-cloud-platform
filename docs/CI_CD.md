# CI/CD

## GitHub Actions workflows

The repository currently contains these workflows:

```text
.github/workflows/auto-deploy-dev.yml
.github/workflows/ci.yml
.github/workflows/deploy.yml
.github/workflows/docker-build-push.yml
.github/workflows/fullstack-ci.yml
.github/workflows/publish-images.yml
.github/workflows/terraform-ci.yml
```

## Main CI responsibilities

The workflows are intended to cover:

- backend tests
- Docker build validation
- Docker image publishing
- Terraform validation
- deployment automation
- dev auto-deploy flow

## Helper scripts

```text
scripts/github-actions/detect-changed-services.py
scripts/github-actions/update-helm-image-tags.sh
```

These scripts support GitHub Actions workflows, including detecting changed services and updating Helm image tags.

## Local validation before push

Before pushing larger changes, run:

```bash
make validate-local-all
```

For smaller backend/frontend changes, run:

```bash
make local-validate
```

For Helm/Kubernetes changes, run:

```bash
make local-k8s-validate
```

## Branching note

The project currently uses a feature branch workflow. Cloud deployment should be checked carefully so feature branches do not unintentionally trigger expensive AWS resources.


## ECR image publishing status

`.github/workflows/publish-images.yml` is the ECR publishing workflow.

Automatic push-triggered ECR publishing is currently disabled while the dev account has ECR repositories disabled. The workflow keeps manual `workflow_dispatch` support.

Do not re-enable push-triggered publishing until the target account has ECR repositories created again through the Terraform ECR stack.

Related workflow and scripts:

```text
.github/workflows/publish-images.yml
.github/workflows/docker-build-push.yml
scripts/docker-build-push.sh
```

## Terraform CI and account variables

Terraform account variables are split by account and stack:

```text
infra/accounts/<account>/common.tfvars
infra/accounts/<account>/<stack>.tfvars
```

`scripts/terraform.sh` composes the correct var files for each stack. This keeps Terraform CI and local plans cleaner by avoiding unrelated variables in stack plans.
