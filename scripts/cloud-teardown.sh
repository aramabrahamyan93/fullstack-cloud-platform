#!/usr/bin/env bash

set -euo pipefail

ACCOUNT="${ACCOUNT:-}"
AWS_PROFILE="${AWS_PROFILE:-}"
AWS_REGION="${AWS_REGION:-}"
PROJECT_NAME="${PROJECT_NAME:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ -f "${REPO_ROOT}/project.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/project.env"
  set +a
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
HELM_RELEASE="fullstack-${ACCOUNT_ENV}"

echo "Cloud teardown"
echo "Environment:    ${ACCOUNT_ENV}"
echo "Account:        ${ACCOUNT}"
echo "Account file:   ${ACCOUNT_FILE}"
echo "AWS Profile:    ${AWS_PROFILE}"
echo "AWS Account ID: ${AWS_ACCOUNT_ID}"
echo "AWS Region:     ${AWS_REGION}"
echo "Project Name:   ${PROJECT_NAME}"
echo "Cluster Name:   ${CLUSTER_NAME}"
echo "Namespace:      ${APP_NAMESPACE}"

echo "Trying to uninstall Kubernetes resources if EKS exists..."
if aws eks describe-cluster \
  --name "${CLUSTER_NAME}" \
  --region "${AWS_REGION}" \
  --profile "${AWS_PROFILE}" >/dev/null 2>&1; then

  aws eks update-kubeconfig \
    --region "${AWS_REGION}" \
    --name "${CLUSTER_NAME}" \
    --profile "${AWS_PROFILE}"

  helm uninstall "${HELM_RELEASE}" -n "${APP_NAMESPACE}" || true
  helm uninstall ingress-nginx -n ingress-nginx || true
  helm uninstall external-secrets -n external-secrets || true

  echo "Waiting for Kubernetes cloud resources cleanup..."
  sleep 60
else
  echo "EKS cluster does not exist. Skipping Helm cleanup."
fi

echo "Terraform will remove EKS/RDS only if these are false in ${ACCOUNT_FILE}:"
echo "  enable_eks = false"
echo "  enable_rds = false"

echo "Applying Terraform platform stack..."
$(command -v make) tf-apply STACK=platform ACCOUNT="${ACCOUNT}" AWS_PROFILE="${AWS_PROFILE}"

echo "Verifying EKS deletion..."
if aws eks describe-cluster \
  --name "${CLUSTER_NAME}" \
  --region "${AWS_REGION}" \
  --profile "${AWS_PROFILE}" >/dev/null 2>&1; then
  echo "WARNING: EKS cluster still exists."
else
  echo "EKS cluster is deleted."
fi

echo "Verifying RDS deletion..."
if aws rds describe-db-instances \
  --db-instance-identifier "${CLUSTER_NAME}" \
  --region "${AWS_REGION}" \
  --profile "${AWS_PROFILE}" >/dev/null 2>&1; then
  echo "WARNING: RDS instance still exists."
else
  echo "RDS instance is deleted."
fi

echo "Checking leftover Kubernetes LoadBalancers..."
aws elbv2 describe-load-balancers \
  --region "${AWS_REGION}" \
  --profile "${AWS_PROFILE}" \
  --query "LoadBalancers[?contains(LoadBalancerName, 'k8s')].[LoadBalancerName,DNSName,State.Code]" \
  --output table || true

echo "Cloud teardown completed."