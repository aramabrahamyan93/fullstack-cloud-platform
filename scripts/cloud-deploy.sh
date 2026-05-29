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

ACCOUNT_FILE="${REPO_ROOT}/infra/accounts/${ACCOUNT}.tfvars"

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

CLUSTER_NAME="${PROJECT_NAME}-${ACCOUNT_ENV}"
APP_NAMESPACE="fullstack-${ACCOUNT_ENV}"
APP_HOST="${ACCOUNT_ENV}.${PROJECT_NAME}.local"

echo "Cloud deploy"
echo "Environment:    ${ACCOUNT_ENV}"
echo "Account:        ${ACCOUNT}"
echo "Account file:   ${ACCOUNT_FILE}"
echo "AWS Profile:    ${AWS_PROFILE}"
echo "AWS Account ID: ${AWS_ACCOUNT_ID}"
echo "AWS Region:     ${AWS_REGION}"
echo "Project Name:   ${PROJECT_NAME}"
echo "Cluster Name:   ${CLUSTER_NAME}"
echo "Namespace:      ${APP_NAMESPACE}"

echo "Applying Terraform platform stack..."
make tf-apply STACK=platform ACCOUNT="${ACCOUNT}" AWS_PROFILE="${AWS_PROFILE}"

echo "Updating kubeconfig..."
aws eks update-kubeconfig \
  --region "${AWS_REGION}" \
  --name "${CLUSTER_NAME}" \
  --profile "${AWS_PROFILE}"

echo "Waiting for EKS nodes..."
kubectl wait node --all --for=condition=Ready --timeout=600s
kubectl get nodes

echo "Installing ingress-nginx..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx >/dev/null 2>&1 || true
helm repo update

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  -n ingress-nginx \
  --create-namespace

kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=600s

echo "Getting External Secrets IRSA role ARN..."
EXTERNAL_SECRETS_ROLE_ARN="$(
  cd "${REPO_ROOT}/infra/stacks/platform" && terraform output -raw external_secrets_role_arn
)"

if [ -z "${EXTERNAL_SECRETS_ROLE_ARN}" ]; then
  echo "ERROR: external_secrets_role_arn output is empty."
  exit 1
fi

echo "Installing external-secrets with IRSA role: ${EXTERNAL_SECRETS_ROLE_ARN}"

helm repo add external-secrets https://charts.external-secrets.io >/dev/null 2>&1 || true
helm repo update

helm upgrade --install external-secrets external-secrets/external-secrets \
  -n external-secrets \
  --create-namespace \
  --set installCRDs=true \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="${EXTERNAL_SECRETS_ROLE_ARN}"

kubectl wait --namespace external-secrets \
  --for=condition=ready pod \
  --all \
  --timeout=600s

echo "Deleting old ClusterSecretStore to avoid jwt/secretRef merge leftovers..."
kubectl delete clustersecretstore aws-secrets-manager --ignore-not-found=true

echo "Deploying application for ENV=${ACCOUNT_ENV}..."
make helm-deploy ENV="${ACCOUNT_ENV}" AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}" IMAGE_TAG="${IMAGE_TAG}"

echo "Waiting for ExternalSecret sync..."
kubectl wait externalsecret backend-database-external-secret \
  -n "${APP_NAMESPACE}" \
  --for=condition=Ready \
  --timeout=300s || true

echo "Waiting for frontend/backend deployments..."
kubectl rollout status deployment/frontend -n "${APP_NAMESPACE}" --timeout=300s || true
kubectl rollout status deployment/backend -n "${APP_NAMESPACE}" --timeout=300s || true

echo "Application status:"
kubectl get pods -n "${APP_NAMESPACE}" || true
kubectl get svc -n "${APP_NAMESPACE}" || true
kubectl get ingress -n "${APP_NAMESPACE}" || true
kubectl get clustersecretstore || true
kubectl get externalsecret -n "${APP_NAMESPACE}" || true
kubectl get secret backend-database-secret -n "${APP_NAMESPACE}" || true

LB_HOST="$(kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true)"

if [ -n "${LB_HOST}" ]; then
  echo "LoadBalancer host: ${LB_HOST}"

  echo "Smoke test: frontend"
  curl -sS -f -H "Host: ${APP_HOST}" "http://${LB_HOST}/" >/dev/null
  echo "Frontend OK"

  echo "Smoke test: backend health"
  HEALTH_RESPONSE="$(curl -sS -f -H "Host: ${APP_HOST}" "http://${LB_HOST}/api/health")"

  echo "${HEALTH_RESPONSE}"

  if ! echo "${HEALTH_RESPONSE}" | grep -q '"status":"ok"'; then
    echo "ERROR: Backend health check did not return status ok."
    exit 1
  fi

  echo "Backend health OK"
else
  echo "ERROR: LoadBalancer hostname is not ready."
  exit 1
fi

echo "Cloud deploy completed."
echo "Reminder: EKS/RDS/LoadBalancer are active and generating cost."