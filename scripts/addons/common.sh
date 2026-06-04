#!/usr/bin/env bash

ACCOUNT="${ACCOUNT:-}"
AWS_PROFILE="${AWS_PROFILE:-}"
AWS_REGION="${AWS_REGION:-eu-central-1}"
PROJECT_NAME="${PROJECT_NAME:-fullstack-cloud-platform}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ACCOUNT_ENV="${ACCOUNT%%-*}"
AWS_ACCOUNT_ID="$(echo "${ACCOUNT}" | grep -oE '[0-9]{12}' || true)"

ADDONS_ENV_FILE="${REPO_ROOT}/config/addons/${ACCOUNT_ENV}.env"

load_addons_config() {
  if [ -f "${ADDONS_ENV_FILE}" ]; then
    set -a
    # shellcheck disable=SC1090
    source "${ADDONS_ENV_FILE}"
    set +a
  fi

  ENABLE_ARGOCD="${ENABLE_ARGOCD:-false}"
  ENABLE_ARGOCD_APPLICATION="${ENABLE_ARGOCD_APPLICATION:-false}"
  ENABLE_EXTERNAL_SECRETS="${ENABLE_EXTERNAL_SECRETS:-false}"
  ENABLE_INGRESS_NGINX="${ENABLE_INGRESS_NGINX:-false}"

  ENABLE_ARGO_ROLLOUTS="${ENABLE_ARGO_ROLLOUTS:-false}"
  ENABLE_MONITORING="${ENABLE_MONITORING:-false}"
  ENABLE_LOGGING="${ENABLE_LOGGING:-false}"

  GIT_REPO_URL="${GIT_REPO_URL:-$(git -C "${REPO_ROOT}" config --get remote.origin.url)}"
  GIT_TARGET_REVISION="${ARGOCD_TARGET_REVISION:-${GIT_TARGET_REVISION:-$(git -C "${REPO_ROOT}" branch --show-current)}}"

  export ACCOUNT
  export AWS_PROFILE
  export AWS_REGION
  export PROJECT_NAME
  export REPO_ROOT
  export ACCOUNT_ENV
  export AWS_ACCOUNT_ID
  export ADDONS_ENV_FILE

  export ENABLE_ARGOCD
  export ENABLE_ARGOCD_APPLICATION
  export ENABLE_EXTERNAL_SECRETS
  export ENABLE_INGRESS_NGINX
  export ENABLE_ARGO_ROLLOUTS
  export ENABLE_MONITORING
  export ENABLE_LOGGING

  export GIT_REPO_URL
  export GIT_TARGET_REVISION
}

print_addons_summary() {
  echo "Deploy addons"
  echo "Account:                  ${ACCOUNT}"
  echo "Environment:              ${ACCOUNT_ENV}"
  echo "AWS Profile:              ${AWS_PROFILE:-default}"
  echo "AWS Region:               ${AWS_REGION}"
  echo "AWS Account ID:           ${AWS_ACCOUNT_ID}"
  echo "Project Name:             ${PROJECT_NAME}"
  echo "Addons config:            ${ADDONS_ENV_FILE}"
  echo "Git repo URL:             ${GIT_REPO_URL}"
  echo "Git target revision:      ${GIT_TARGET_REVISION}"
  echo "Enable ArgoCD:            ${ENABLE_ARGOCD}"
  echo "Enable ArgoCD App:        ${ENABLE_ARGOCD_APPLICATION}"
  echo "Enable Argo Rollouts:     ${ENABLE_ARGO_ROLLOUTS}"
  echo "Enable Monitoring:        ${ENABLE_MONITORING}"
  echo "Enable Logging:           ${ENABLE_LOGGING}"
  echo "Enable External Secrets:  ${ENABLE_EXTERNAL_SECRETS}"
  echo "Enable Ingress NGINX:     ${ENABLE_INGRESS_NGINX}"
  echo
}

require_command() {
  local command_name="$1"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "ERROR: Required command is missing: ${command_name}"
    exit 1
  fi
}

validate_common_config() {
  if [ -z "${ACCOUNT}" ]; then
    echo "ERROR: ACCOUNT is required."
    exit 1
  fi

  if [ -z "${AWS_ACCOUNT_ID}" ]; then
    echo "ERROR: AWS account ID could not be resolved from ACCOUNT=${ACCOUNT}"
    exit 1
  fi

  if [ -z "${PROJECT_NAME}" ]; then
    echo "ERROR: PROJECT_NAME is required."
    exit 1
  fi

  if [ -z "${GIT_REPO_URL}" ]; then
    echo "ERROR: GIT_REPO_URL is empty."
    exit 1
  fi

  if [ -z "${GIT_TARGET_REVISION}" ]; then
    echo "ERROR: GIT_TARGET_REVISION is empty."
    exit 1
  fi
}