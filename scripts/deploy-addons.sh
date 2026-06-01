#!/usr/bin/env bash

set -euo pipefail

ACCOUNT="${ACCOUNT:-}"
AWS_PROFILE="${AWS_PROFILE:-}"
AWS_REGION="${AWS_REGION:-eu-central-1}"
PROJECT_NAME="${PROJECT_NAME:-fullstack-cloud-platform}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ACCOUNT_ENV="${ACCOUNT%%-*}"
ADDONS_ENV_FILE="${REPO_ROOT}/config/addons/${ACCOUNT_ENV}.env"

if [ -f "${ADDONS_ENV_FILE}" ]; then
  set -a
  # shellcheck disable=SC1090
  source "${ADDONS_ENV_FILE}"
  set +a
fi

ENABLE_ARGOCD="${ENABLE_ARGOCD:-false}"
ENABLE_ARGO_ROLLOUTS="${ENABLE_ARGO_ROLLOUTS:-false}"
ENABLE_MONITORING="${ENABLE_MONITORING:-false}"
ENABLE_LOGGING="${ENABLE_LOGGING:-false}"

echo "Deploy addons"
echo "Account:              ${ACCOUNT}"
echo "Environment:          ${ACCOUNT_ENV}"
echo "AWS Profile:          ${AWS_PROFILE:-default}"
echo "AWS Region:           ${AWS_REGION}"
echo "Project Name:         ${PROJECT_NAME}"
echo "Addons config:        ${ADDONS_ENV_FILE}"
echo "Enable ArgoCD:        ${ENABLE_ARGOCD}"
echo "Enable Argo Rollouts: ${ENABLE_ARGO_ROLLOUTS}"
echo "Enable Monitoring:    ${ENABLE_MONITORING}"
echo "Enable Logging:       ${ENABLE_LOGGING}"
echo

if [ "${ENABLE_ARGOCD}" = "true" ]; then
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
else
  echo "ArgoCD disabled."
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