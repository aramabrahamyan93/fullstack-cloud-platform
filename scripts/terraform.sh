#!/usr/bin/env bash

set -euo pipefail

ACTION="${ACTION:-plan}"
STACK="${STACK:-ecr}"
ACCOUNT="${ACCOUNT:-dev-859981975099}"

AWS_PROFILE="${AWS_PROFILE:-}"
AWS_REGION="${AWS_REGION:-eu-central-1}"
ACCOUNT_ID="${ACCOUNT_ID:-}"
PROJECT_NAME="${PROJECT_NAME:-}"
LOCK_TABLE="${LOCK_TABLE:-terraform-locks}"
TF_LOCK="${TF_LOCK:-true}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "${REPO_ROOT}/project.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/project.env"
  set +a
fi

PROJECT_NAME="${PROJECT_NAME:-platform}"
AWS_REGION="${AWS_REGION:-eu-central-1}"

STACK_DIR="${REPO_ROOT}/infra/stacks/${STACK}"

GLOBAL_VARS="../../config/global.tfvars"
ACCOUNT_VARS="../../accounts/${ACCOUNT}.tfvars"

EXTRA_VAR_FILES=()
CLI_VARS=(
  "-var=project_name=${PROJECT_NAME}"
  "-var=aws_region=${AWS_REGION}"
)

if [ ! -d "${STACK_DIR}" ]; then
  echo "ERROR: Terraform stack directory does not exist: ${STACK_DIR}"
  exit 1
fi

if [ ! -f "${REPO_ROOT}/infra/accounts/${ACCOUNT}.tfvars" ]; then
  echo "ERROR: Account config does not exist: infra/accounts/${ACCOUNT}.tfvars"
  exit 1
fi

if [ -z "${ACCOUNT_ID}" ]; then
  ACCOUNT_ID="$(echo "${ACCOUNT}" | grep -oE '[0-9]{12}' || true)"
fi

if [ -z "${ACCOUNT_ID}" ]; then
  echo "ERROR: ACCOUNT_ID is required or must be included in ACCOUNT name."
  echo "Example: ACCOUNT=dev-859981975099"
  exit 1
fi

AWS_ENV=()
if [ -n "${AWS_PROFILE}" ]; then
  AWS_ENV=("AWS_PROFILE=${AWS_PROFILE}")
fi

case "${STACK}" in
  ecr)
    EXTRA_VAR_FILES+=("-var-file=${GLOBAL_VARS}")
    EXTRA_VAR_FILES+=("-var-file=../../config/services.tfvars")
    EXTRA_VAR_FILES+=("-var-file=${ACCOUNT_VARS}")
    ;;

  bootstrap)
    EXTRA_VAR_FILES+=("-var-file=${GLOBAL_VARS}")
    EXTRA_VAR_FILES+=("-var-file=../../config/services.tfvars")
    EXTRA_VAR_FILES+=("-var-file=../../config/github.tfvars")
    EXTRA_VAR_FILES+=("-var-file=${ACCOUNT_VARS}")
    ;;

  platform)
    EXTRA_VAR_FILES+=("-var-file=${GLOBAL_VARS}")
    EXTRA_VAR_FILES+=("-var-file=../../config/platform.tfvars")
    EXTRA_VAR_FILES+=("-var-file=${ACCOUNT_VARS}")
    ;;

  *)
    EXTRA_VAR_FILES+=("-var-file=${GLOBAL_VARS}")
    EXTRA_VAR_FILES+=("-var-file=${ACCOUNT_VARS}")
    ;;
esac

echo "Terraform action: ${ACTION}"
echo "Stack:            ${STACK}"
echo "Account:          ${ACCOUNT}"
echo "Account ID:       ${ACCOUNT_ID}"
echo "AWS Region:       ${AWS_REGION}"
echo "AWS Profile:      ${AWS_PROFILE:-default}"
echo "Project Name:     ${PROJECT_NAME}"
echo "Terraform lock:   ${TF_LOCK}"
echo "Stack Dir:        ${STACK_DIR}"

case "${ACTION}" in
  fmt)
    cd "${REPO_ROOT}"
    terraform fmt -check -recursive infra
    ;;

  init)
    cd "${STACK_DIR}"

    env "${AWS_ENV[@]}" terraform init \
      -backend-config="bucket=${ACCOUNT_ID}-tf-state" \
      -backend-config="key=${PROJECT_NAME}/${ACCOUNT}/${STACK}/terraform.tfstate" \
      -backend-config="region=${AWS_REGION}" \
      -backend-config="dynamodb_table=${LOCK_TABLE}" \
      -backend-config="encrypt=true"
    ;;

  validate)
    cd "${STACK_DIR}"
    env "${AWS_ENV[@]}" terraform validate
    ;;

  plan)
    cd "${STACK_DIR}"

    env "${AWS_ENV[@]}" terraform plan \
      -lock="${TF_LOCK}" \
      "${EXTRA_VAR_FILES[@]}" \
      "${CLI_VARS[@]}"
    ;;

  apply)
    cd "${STACK_DIR}"

    env "${AWS_ENV[@]}" terraform apply \
      "${EXTRA_VAR_FILES[@]}" \
      "${CLI_VARS[@]}"
    ;;

  destroy)
    cd "${STACK_DIR}"

    env "${AWS_ENV[@]}" terraform destroy \
      "${EXTRA_VAR_FILES[@]}" \
      "${CLI_VARS[@]}"
    ;;

  *)
    echo "ERROR: Unsupported ACTION=${ACTION}"
    echo "Supported actions: fmt, init, validate, plan, apply, destroy"
    exit 1
    ;;
esac