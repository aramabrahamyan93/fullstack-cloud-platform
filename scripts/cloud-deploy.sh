#!/usr/bin/env bash

set -euo pipefail

ACCOUNT="${ACCOUNT:-}"
AWS_PROFILE="${AWS_PROFILE:-}"
AWS_REGION="${AWS_REGION:-}"
PROJECT_NAME="${PROJECT_NAME:-}"
IMAGE_TAG="${IMAGE_TAG:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ -f "${REPO_ROOT}/project.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/project.env"
  set +a
fi

if [ -z "${IMAGE_TAG}" ] && [ -f "${REPO_ROOT}/.image-tag" ]; then
  IMAGE_TAG="$(cat "${REPO_ROOT}/.image-tag")"
fi

AWS_REGION="${AWS_REGION:-eu-central-1}"

if [ -z "${ACCOUNT}" ]; then
  echo "ERROR: ACCOUNT is required. Example: ACCOUNT=dev-859981975099"
  exit 1
fi

if [[ ! "${ACCOUNT}" =~ ^([a-zA-Z0-9_-]+)-([0-9]{12})$ ]]; then
  echo "ERROR: ACCOUNT must match format: {ENV}-{AWS_ACCOUNT_ID}"
  echo "Example: ACCOUNT=dev-859981975099"
  exit 1
fi

ACCOUNT_ENV="${BASH_REMATCH[1]}"
AWS_ACCOUNT_ID="${BASH_REMATCH[2]}"

export ENV="${ACCOUNT_ENV}"
export ACCOUNT
export AWS_PROFILE
export AWS_REGION
export PROJECT_NAME

ACCOUNT_FILE="${REPO_ROOT}/infra/accounts/${ACCOUNT}.tfvars"
ADDONS_ENV_FILE="${REPO_ROOT}/config/addons/${ACCOUNT_ENV}.env"

if [ ! -f "${ACCOUNT_FILE}" ]; then
  echo "ERROR: Account tfvars file not found: ${ACCOUNT_FILE}"
  exit 1
fi

if [ -z "${AWS_PROFILE}" ]; then
  echo "ERROR: AWS_PROFILE is required. Example: AWS_PROFILE=aram-dev"
  exit 1
fi

if [ -z "${PROJECT_NAME}" ]; then
  echo "ERROR: PROJECT_NAME is required. Set it in project.env or pass PROJECT_NAME=..."
  exit 1
fi

if [ -f "${ADDONS_ENV_FILE}" ]; then
  set -a
  # shellcheck disable=SC1090
  source "${ADDONS_ENV_FILE}"
  set +a
else
  echo "WARNING: Addons config file not found: ${ADDONS_ENV_FILE}"
fi

ENABLE_ARGOCD_APPLICATION="${ENABLE_ARGOCD_APPLICATION:-false}"
ENABLE_ARGOCD="${ENABLE_ARGOCD:-false}"
ENABLE_EXTERNAL_SECRETS="${ENABLE_EXTERNAL_SECRETS:-false}"
ENABLE_INGRESS_NGINX="${ENABLE_INGRESS_NGINX:-false}"
ENABLE_MONITORING="${ENABLE_MONITORING:-false}"
GIT_TARGET_REVISION="${ARGOCD_TARGET_REVISION:-${GIT_TARGET_REVISION:-$(git -C "${REPO_ROOT}" branch --show-current)}}"

CLUSTER_NAME="${PROJECT_NAME}-${ACCOUNT_ENV}"
APP_NAMESPACE="fullstack-${ACCOUNT_ENV}"
APP_HOST="${ACCOUNT_ENV}.${PROJECT_NAME}.local"
ARGOCD_APP_NAME="fullstack-${ACCOUNT_ENV}"

wait_for_argocd_application() {
  echo "Waiting for ArgoCD Application: ${ARGOCD_APP_NAME}"

  for i in {1..60}; do
    if kubectl get application "${ARGOCD_APP_NAME}" -n argocd >/dev/null 2>&1; then
      echo "ArgoCD Application exists."
      break
    fi

    echo "Waiting for ArgoCD Application to be created ${i}/60..."
    sleep 10
  done

  if ! kubectl get application "${ARGOCD_APP_NAME}" -n argocd >/dev/null 2>&1; then
    echo "ERROR: ArgoCD Application was not created: ${ARGOCD_APP_NAME}"
    kubectl get applications -n argocd || true
    exit 1
  fi

  echo "Waiting for ArgoCD Application to become Synced and Healthy..."

  for i in {1..90}; do
    local sync_status
    local health_status

    sync_status="$(
      kubectl get application "${ARGOCD_APP_NAME}" \
        -n argocd \
        -o jsonpath='{.status.sync.status}' 2>/dev/null || true
    )"

    health_status="$(
      kubectl get application "${ARGOCD_APP_NAME}" \
        -n argocd \
        -o jsonpath='{.status.health.status}' 2>/dev/null || true
    )"

    echo "ArgoCD status ${i}/90: sync=${sync_status:-unknown}, health=${health_status:-unknown}"

    if [ "${sync_status}" = "Synced" ] && [ "${health_status}" = "Healthy" ]; then
      echo "ArgoCD Application is Synced and Healthy."
      return
    fi

    sleep 10
  done

  echo "ERROR: ArgoCD Application did not become Synced and Healthy in time."
  echo "Application summary:"
  kubectl get application "${ARGOCD_APP_NAME}" -n argocd -o wide || true

  echo
  echo "Application details:"
  kubectl describe application "${ARGOCD_APP_NAME}" -n argocd || true

  echo
  echo "ArgoCD pods:"
  kubectl get pods -n argocd || true

  exit 1
}

wait_for_app_rollout() {
  echo "Waiting for frontend/backend deployments..."

  kubectl rollout status deployment/frontend \
    -n "${APP_NAMESPACE}" \
    --timeout=300s

  kubectl rollout status deployment/backend \
    -n "${APP_NAMESPACE}" \
    --timeout=300s
}

print_application_status() {
  echo "Application status:"
  kubectl get pods -n "${APP_NAMESPACE}" || true
  kubectl get svc -n "${APP_NAMESPACE}" || true
  kubectl get ingress -n "${APP_NAMESPACE}" || true
  kubectl get clustersecretstore || true
  kubectl get externalsecret -n "${APP_NAMESPACE}" || true
  kubectl get secret backend-database-secret -n "${APP_NAMESPACE}" || true
  kubectl get servicemonitor -n "${APP_NAMESPACE}" || true

  echo
  echo "Addon status:"
  kubectl get pods -n external-secrets || true
  kubectl get pods -n ingress-nginx || true
  kubectl get pods -n monitoring || true
  kubectl get pods -n argocd || true
  kubectl get applications -n argocd || true
}

run_smoke_tests() {
  echo "Waiting for LoadBalancer hostname..."

  local lb_host=""

  for i in {1..60}; do
    lb_host="$(
      kubectl get svc ingress-nginx-controller \
        -n ingress-nginx \
        -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true
    )"

    if [ -n "${lb_host}" ]; then
      break
    fi

    echo "Waiting for LoadBalancer hostname ${i}/60..."
    sleep 10
  done

  if [ -z "${lb_host}" ]; then
    echo "ERROR: LoadBalancer hostname is not ready."
    kubectl get svc ingress-nginx-controller -n ingress-nginx -o wide || true
    exit 1
  fi

  echo "LoadBalancer host: ${lb_host}"

  echo "Smoke test: frontend"
  curl -sS -f -H "Host: ${APP_HOST}" "http://${lb_host}/" >/dev/null
  echo "Frontend OK"

  echo "Smoke test: backend health"
  local health_response
  health_response="$(curl -sS -f -H "Host: ${APP_HOST}" "http://${lb_host}/api/health")"

  echo "${health_response}"

  if ! echo "${health_response}" | grep -q '"status":"ok"'; then
    echo "ERROR: Backend health check did not return status ok."
    exit 1
  fi

  echo "Backend health OK"
}

echo "Cloud deploy"
echo "Environment:              ${ACCOUNT_ENV}"
echo "Account:                  ${ACCOUNT}"
echo "Account file:             ${ACCOUNT_FILE}"
echo "Addons config:            ${ADDONS_ENV_FILE}"
echo "AWS Profile:              ${AWS_PROFILE}"
echo "AWS Account ID:           ${AWS_ACCOUNT_ID}"
echo "AWS Region:               ${AWS_REGION}"
echo "Project Name:             ${PROJECT_NAME}"
echo "Cluster Name:             ${CLUSTER_NAME}"
echo "Namespace:                ${APP_NAMESPACE}"
echo "Image Tag:                ${IMAGE_TAG:-not set}"
echo "Enable ArgoCD:            ${ENABLE_ARGOCD}"
echo "Enable ArgoCD App:        ${ENABLE_ARGOCD_APPLICATION}"
echo "Enable External Secrets:  ${ENABLE_EXTERNAL_SECRETS}"
echo "Enable Ingress NGINX:     ${ENABLE_INGRESS_NGINX}"
echo "Enable Monitoring:        ${ENABLE_MONITORING}"
echo "Git target revision:      ${GIT_TARGET_REVISION}"
echo

echo "Applying Terraform platform stack..."
make tf-apply \
  STACK=platform \
  ACCOUNT="${ACCOUNT}" \
  AWS_PROFILE="${AWS_PROFILE}"

echo "Updating kubeconfig..."
aws eks update-kubeconfig \
  --region "${AWS_REGION}" \
  --name "${CLUSTER_NAME}" \
  --profile "${AWS_PROFILE}"

echo "Waiting for EKS nodes..."
kubectl wait node --all --for=condition=Ready --timeout=600s
kubectl get nodes

echo "Deploying enabled addons from ${ADDONS_ENV_FILE}..."
make deploy-addons \
  ACCOUNT="${ACCOUNT}" \
  AWS_PROFILE="${AWS_PROFILE}" \
  AWS_REGION="${AWS_REGION}" \
  PROJECT_NAME="${PROJECT_NAME}"

if [ "${ENABLE_ARGOCD_APPLICATION}" = "true" ]; then
  echo "GitOps mode is enabled."
  echo "Application will be deployed by ArgoCD. Skipping direct Helm app deploy."
  echo "ArgoCD target revision: ${GIT_TARGET_REVISION}"

  wait_for_argocd_application
else
  echo "GitOps mode is disabled."
  echo "Deploying application directly with Helm..."

  make helm-deploy \
    ENV="${ACCOUNT_ENV}" \
    AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}" \
    IMAGE_TAG="${IMAGE_TAG}"
fi

echo "Waiting for ExternalSecret sync..."
kubectl wait externalsecret backend-database-external-secret \
  -n "${APP_NAMESPACE}" \
  --for=condition=Ready \
  --timeout=300s || true

wait_for_app_rollout
print_application_status
run_smoke_tests

echo "Cloud deploy completed."
echo "Reminder: EKS/RDS/LoadBalancer are active and generating cost."