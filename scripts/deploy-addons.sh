#!/usr/bin/env bash

set -euo pipefail

ACCOUNT="${ACCOUNT:-}"
AWS_PROFILE="${AWS_PROFILE:-}"
AWS_REGION="${AWS_REGION:-eu-central-1}"
PROJECT_NAME="${PROJECT_NAME:-fullstack-cloud-platform}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ACCOUNT_ENV="${ACCOUNT%%-*}"
AWS_ACCOUNT_ID="$(echo "${ACCOUNT}" | grep -oE '[0-9]{12}' || true)"

ADDONS_ENV_FILE="${REPO_ROOT}/config/addons/${ACCOUNT_ENV}.env"

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

deploy_external_secrets() {
  echo "Deploying External Secrets..."

  local external_secrets_role_arn="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${PROJECT_NAME}-${ACCOUNT_ENV}-external-secrets-role"

  helm repo add external-secrets https://charts.external-secrets.io || true
  helm repo update

  helm upgrade --install external-secrets external-secrets/external-secrets \
    --namespace external-secrets \
    --create-namespace \
    -f "${REPO_ROOT}/addons/external-secrets/values.yaml" \
    --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="${external_secrets_role_arn}" \
    --wait \
    --timeout 10m

  kubectl rollout status deployment/external-secrets \
    -n external-secrets \
    --timeout=600s

  kubectl rollout status deployment/external-secrets-webhook \
    -n external-secrets \
    --timeout=600s

  kubectl rollout status deployment/external-secrets-cert-controller \
    -n external-secrets \
    --timeout=600s

  echo "External Secrets deployed successfully."
}

deploy_argocd() {
  echo "Deploying ArgoCD..."

  helm repo add argo https://argoproj.github.io/argo-helm || true
  helm repo update

  helm upgrade --install argocd argo/argo-cd \
    --namespace argocd \
    --create-namespace \
    -f "${REPO_ROOT}/addons/argocd/values.yaml" \
    --wait \
    --timeout 10m

  kubectl rollout status statefulset/argocd-application-controller \
    -n argocd \
    --timeout=600s

  kubectl rollout status deployment/argocd-server \
    -n argocd \
    --timeout=600s

  kubectl rollout status deployment/argocd-repo-server \
    -n argocd \
    --timeout=600s

  kubectl rollout status deployment/argocd-redis \
    -n argocd \
    --timeout=600s

  echo "ArgoCD deployed successfully."
}

deploy_argocd_application() {
  local template_file="${REPO_ROOT}/addons/argocd/applications/fullstack-app.yaml.tpl"

  if [ ! -f "${template_file}" ]; then
    echo "ERROR: ArgoCD application template does not exist: ${template_file}"
    exit 1
  fi

  echo "Deploying ArgoCD Application for environment: ${ACCOUNT_ENV}"

  export ENVIRONMENT="${ACCOUNT_ENV}"
  export PROJECT_NAME
  export AWS_REGION
  export AWS_ACCOUNT_ID
  export GIT_REPO_URL
  export GIT_TARGET_REVISION

  envsubst < "${template_file}" | kubectl apply -f -

  echo "ArgoCD Application applied successfully."
}

deploy_ingress_nginx() {
  echo "Deploying Ingress NGINX..."

  helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx || true
  helm repo update

  helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
    --namespace ingress-nginx \
    --create-namespace \
    -f "${REPO_ROOT}/addons/ingress-nginx/values.yaml" \
    --wait \
    --timeout 15m

  kubectl rollout status deployment/ingress-nginx-controller \
    -n ingress-nginx \
    --timeout=900s

  echo "Ingress NGINX deployed successfully."
}

validate_common_config
require_command helm
require_command kubectl
require_command envsubst

if [ "${ENABLE_EXTERNAL_SECRETS}" = "true" ]; then
  deploy_external_secrets
else
  echo "External Secrets disabled."
fi

if [ "${ENABLE_ARGOCD}" = "true" ]; then
  deploy_argocd
else
  echo "ArgoCD disabled."
fi

if [ "${ENABLE_INGRESS_NGINX}" = "true" ]; then
  deploy_ingress_nginx
else
  echo "Ingress NGINX disabled."
fi

if [ "${ENABLE_ARGOCD_APPLICATION}" = "true" ]; then
  if [ "${ENABLE_ARGOCD}" != "true" ]; then
    echo "ERROR: ENABLE_ARGOCD_APPLICATION=true requires ENABLE_ARGOCD=true"
    exit 1
  fi

  deploy_argocd_application
else
  echo "ArgoCD Application disabled."
fi

if [ "${ENABLE_ARGO_ROLLOUTS}" = "true" ]; then
  echo "Argo Rollouts enabled - deployment not implemented yet."
else
  echo "Argo Rollouts disabled."
fi

if [ "${ENABLE_MONITORING}" = "true" ]; then
  echo "Monitoring enabled - deployment not implemented yet."
else
  echo "Monitoring disabled."
fi

if [ "${ENABLE_LOGGING}" = "true" ]; then
  echo "Logging enabled - deployment not implemented yet."
else
  echo "Logging disabled."
fi

echo
echo "Addons deployment completed."