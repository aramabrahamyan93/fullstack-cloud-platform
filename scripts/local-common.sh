#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

load_env_file() {
  local file_path="$1"

  if [ -f "${file_path}" ]; then
    set -a
    # shellcheck disable=SC1090
    source "${file_path}"
    set +a
  fi
}

require_command() {
  local command_name="$1"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "ERROR: Required command is missing: ${command_name}"
    exit 1
  fi
}

require_env() {
  local variable_name="$1"

  if [ -z "${!variable_name:-}" ]; then
    echo "ERROR: Required configuration value is missing: ${variable_name}"
    echo "Config file: ${LOCAL_CONFIG_FILE}"
    exit 1
  fi
}

to_repo_path() {
  local value="$1"

  if [[ "${value}" = /* ]] || [[ "${value}" =~ ^[A-Za-z]:[\\/] ]]; then
    echo "${value}"
  else
    echo "${REPO_ROOT}/${value}"
  fi
}

load_local_config() {
  ENV="${ENV:-local}"
  PROJECT_ENV_FILE="${PROJECT_ENV_FILE:-${REPO_ROOT}/project.env}"
  LOCAL_CONFIG_FILE="${LOCAL_CONFIG_FILE:-${REPO_ROOT}/config/addons/${ENV}.env}"

  load_env_file "${PROJECT_ENV_FILE}"
  load_env_file "${LOCAL_CONFIG_FILE}"

  require_env ARGOCD_TARGET_REVISION
  require_env APP_ACCESS_LOCAL_PORT
  require_env ARGOCD_LOCAL_PORT
  require_env PROMETHEUS_LOCAL_PORT
  require_env GRAFANA_LOCAL_PORT
  require_env MONITORING_CHART_VERSION
  require_env ARGOCD_CHART_VERSION
  require_env MONITORING_CHART_VERSION
  require_env ARGOCD_CHART_VERSION

  PROJECT_NAME="${PROJECT_NAME:-fullstack-cloud-platform}"
  RELEASE_PREFIX="${RELEASE_PREFIX:-fullstack}"
  PROJECT_DOMAIN="${PROJECT_DOMAIN:-${PROJECT_NAME}.local}"

  AWS_REGION="${AWS_REGION:-eu-central-1}"
  AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"

  KIND_CLUSTER="${KIND_CLUSTER:-${PROJECT_NAME}}"
  K8S_NAMESPACE="${K8S_NAMESPACE:-${RELEASE_PREFIX}-${ENV}}"
  HELM_RELEASE="${HELM_RELEASE:-${RELEASE_PREFIX}-${ENV}}"
  HELM_CHART="${HELM_CHART:-helm/platform}"
  HELM_VALUES="${HELM_VALUES:-${HELM_CHART}/values-${ENV}.yaml}"
  LOCAL_MONITORING_HELM_EXTRA_VALUES="${LOCAL_MONITORING_HELM_EXTRA_VALUES:-${HELM_CHART}/values-${ENV}-monitoring.yaml}"

  GIT_REPO_URL="${GIT_REPO_URL:-$(git -C "${REPO_ROOT}" config --get remote.origin.url)}"
  GIT_TARGET_REVISION="${GIT_TARGET_REVISION:-${ARGOCD_TARGET_REVISION}}"

  APP_ACCESS_NAMESPACE="${APP_ACCESS_NAMESPACE:-${K8S_NAMESPACE}}"
  APP_ACCESS_SERVICE="${APP_ACCESS_SERVICE:-frontend}"
  APP_ACCESS_SERVICE_PORT="${APP_ACCESS_SERVICE_PORT:-80}"
  APP_ACCESS_LOCAL_PORT="${APP_ACCESS_LOCAL_PORT}"

  MONITORING_NAMESPACE="${MONITORING_NAMESPACE:-monitoring}"
  MONITORING_RELEASE="${MONITORING_RELEASE:-monitoring}"
  MONITORING_CHART_VERSION="${MONITORING_CHART_VERSION}"
  MONITORING_CHART_VERSION="${MONITORING_CHART_VERSION}"
  MONITORING_VALUES="${MONITORING_VALUES:-addons/monitoring/values.yaml}"
  MONITORING_VALUES_PATH="$(to_repo_path "${MONITORING_VALUES}")"

  PROMETHEUS_SERVICE="${PROMETHEUS_SERVICE:-${MONITORING_RELEASE}-kube-prometheus-prometheus}"
  PROMETHEUS_SERVICE_PORT="${PROMETHEUS_SERVICE_PORT:-9090}"
  PROMETHEUS_LOCAL_PORT="${PROMETHEUS_LOCAL_PORT}"

  GRAFANA_SERVICE="${GRAFANA_SERVICE:-${MONITORING_RELEASE}-grafana}"
  GRAFANA_SERVICE_PORT="${GRAFANA_SERVICE_PORT:-80}"
  GRAFANA_LOCAL_PORT="${GRAFANA_LOCAL_PORT}"

  ARGOCD_NAMESPACE="${ARGOCD_NAMESPACE:-argocd}"
  ARGOCD_RELEASE="${ARGOCD_RELEASE:-argocd}"
  ARGOCD_CHART_VERSION="${ARGOCD_CHART_VERSION}"
  ARGOCD_CHART_VERSION="${ARGOCD_CHART_VERSION}"
  ARGOCD_VALUES="${ARGOCD_VALUES:-addons/argocd/values.yaml}"
  ARGOCD_VALUES_PATH="$(to_repo_path "${ARGOCD_VALUES}")"
  ARGOCD_LOCAL_PORT="${ARGOCD_LOCAL_PORT}"

  ARGOCD_PROJECT="${ARGOCD_PROJECT:-default}"
  ARGOCD_DESTINATION_SERVER="${ARGOCD_DESTINATION_SERVER:-https://kubernetes.default.svc}"
  ARGOCD_APP_TEMPLATE="${ARGOCD_APP_TEMPLATE:-addons/argocd/applications/local-app.yaml.tpl}"
  ARGOCD_APP_TEMPLATE_PATH="$(to_repo_path "${ARGOCD_APP_TEMPLATE}")"

  ARGOCD_APP_NAME="${ARGOCD_APP_NAME:-${HELM_RELEASE}}"
  ARGOCD_APP_RELEASE_NAME="${ARGOCD_APP_RELEASE_NAME:-${HELM_RELEASE}}"
  ARGOCD_APP_DESTINATION_NAMESPACE="${ARGOCD_APP_DESTINATION_NAMESPACE:-${K8S_NAMESPACE}}"
  ARGOCD_APP_SOURCE_PATH="${ARGOCD_APP_SOURCE_PATH:-${HELM_CHART}}"
  ARGOCD_APP_VALUE_FILES="${ARGOCD_APP_VALUE_FILES:-values-${ENV}.yaml values-${ENV}-monitoring.yaml}"

  export REPO_ROOT
  export ENV

  export PROJECT_NAME
  export RELEASE_PREFIX
  export PROJECT_DOMAIN
  export AWS_REGION
  export AWS_ACCOUNT_ID

  export KIND_CLUSTER
  export K8S_NAMESPACE
  export HELM_RELEASE
  export HELM_CHART
  export HELM_VALUES
  export LOCAL_MONITORING_HELM_EXTRA_VALUES

  export GIT_REPO_URL
  export GIT_TARGET_REVISION

  export APP_ACCESS_NAMESPACE
  export APP_ACCESS_SERVICE
  export APP_ACCESS_SERVICE_PORT
  export APP_ACCESS_LOCAL_PORT

  export MONITORING_NAMESPACE
  export MONITORING_RELEASE
  export MONITORING_CHART_VERSION
  export MONITORING_CHART_VERSION
  export MONITORING_VALUES
  export MONITORING_VALUES_PATH
  export PROMETHEUS_SERVICE
  export PROMETHEUS_SERVICE_PORT
  export PROMETHEUS_LOCAL_PORT
  export GRAFANA_SERVICE
  export GRAFANA_SERVICE_PORT
  export GRAFANA_LOCAL_PORT

  export ARGOCD_NAMESPACE
  export ARGOCD_RELEASE
  export ARGOCD_CHART_VERSION
  export ARGOCD_CHART_VERSION
  export ARGOCD_VALUES
  export ARGOCD_VALUES_PATH
  export ARGOCD_LOCAL_PORT
  export ARGOCD_PROJECT
  export ARGOCD_DESTINATION_SERVER
  export ARGOCD_APP_TEMPLATE
  export ARGOCD_APP_TEMPLATE_PATH
  export ARGOCD_APP_NAME
  export ARGOCD_APP_RELEASE_NAME
  export ARGOCD_APP_DESTINATION_NAMESPACE
  export ARGOCD_APP_SOURCE_PATH
  export ARGOCD_APP_VALUE_FILES
}

print_local_summary() {
  echo "Local config"
  echo "Project env:          ${PROJECT_ENV_FILE}"
  echo "Local config:         ${LOCAL_CONFIG_FILE}"
  echo "Environment:          ${ENV}"
  echo "Project:              ${PROJECT_NAME}"
  echo "Release prefix:       ${RELEASE_PREFIX}"
  echo "Kind cluster:         ${KIND_CLUSTER}"
  echo "Namespace:            ${K8S_NAMESPACE}"
  echo "Helm release:         ${HELM_RELEASE}"
  echo "Helm chart:           ${HELM_CHART}"
  echo "Git target revision:  ${GIT_TARGET_REVISION}"
  echo
}
