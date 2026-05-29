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

AWS_REGION="${AWS_REGION:-eu-central-1}"

if [ -z "${ACCOUNT}" ]; then
  echo "ERROR: ACCOUNT is required. Example: ACCOUNT=dev-859981975099"
  exit 1
fi

if [[ ! "${ACCOUNT}" =~ ^([a-zA-Z0-9_-]+)-([0-9]{12})$ ]]; then
  echo "ERROR: ACCOUNT must match format: {ENV}-{AWS_ACCOUNT_ID}"
  exit 1
fi

ENV="${BASH_REMATCH[1]}"
AWS_ACCOUNT_ID="${BASH_REMATCH[2]}"

if [ -z "${AWS_PROFILE}" ] && [ "${CI:-false}" != "true" ]; then
  echo "ERROR: AWS_PROFILE is required for local runs."
  exit 1
fi

if [ -z "${PROJECT_NAME}" ]; then
  echo "ERROR: PROJECT_NAME is required. Set it in project.env."
  exit 1
fi

if [ -z "${IMAGE_TAG}" ]; then
  IMAGE_TAG="$(git -C "${REPO_ROOT}" rev-parse --short HEAD)"
fi

if [ -z "${IMAGE_TAG}" ]; then
  echo "ERROR: IMAGE_TAG could not be resolved."
  exit 1
fi

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
BACKEND_REPO="${PROJECT_NAME}-backend"
FRONTEND_REPO="${PROJECT_NAME}-frontend"

echo "Docker build and push"
echo "Environment:    ${ENV}"
echo "Account:        ${ACCOUNT}"
echo "AWS Profile:    ${AWS_PROFILE}"
echo "AWS Account ID: ${AWS_ACCOUNT_ID}"
echo "AWS Region:     ${AWS_REGION}"
echo "Project Name:   ${PROJECT_NAME}"
echo "Image Tag:      ${IMAGE_TAG}"
echo "ECR Registry:   ${ECR_REGISTRY}"

echo "Logging in to ECR..."
if [ -n "${AWS_PROFILE}" ]; then
  aws ecr get-login-password \
    --region "${AWS_REGION}" \
    --profile "${AWS_PROFILE}" | docker login \
    --username AWS \
    --password-stdin "${ECR_REGISTRY}"
else
  aws ecr get-login-password \
    --region "${AWS_REGION}" | docker login \
    --username AWS \
    --password-stdin "${ECR_REGISTRY}"
fi

echo "Building backend image..."
docker build \
  -t "${BACKEND_REPO}:${IMAGE_TAG}" \
  "${REPO_ROOT}/backend"

echo "Tagging backend image..."
docker tag \
  "${BACKEND_REPO}:${IMAGE_TAG}" \
  "${ECR_REGISTRY}/${BACKEND_REPO}:${IMAGE_TAG}"

echo "Pushing backend image..."
docker push "${ECR_REGISTRY}/${BACKEND_REPO}:${IMAGE_TAG}"

echo "Building frontend image..."
docker build \
  -t "${FRONTEND_REPO}:${IMAGE_TAG}" \
  "${REPO_ROOT}/frontend"

echo "Tagging frontend image..."
docker tag \
  "${FRONTEND_REPO}:${IMAGE_TAG}" \
  "${ECR_REGISTRY}/${FRONTEND_REPO}:${IMAGE_TAG}"

echo "Pushing frontend image..."
docker push "${ECR_REGISTRY}/${FRONTEND_REPO}:${IMAGE_TAG}"

echo "Docker build and push completed."
echo "Backend:  ${ECR_REGISTRY}/${BACKEND_REPO}:${IMAGE_TAG}"
echo "Frontend: ${ECR_REGISTRY}/${FRONTEND_REPO}:${IMAGE_TAG}"

echo "${IMAGE_TAG}" > "${REPO_ROOT}/.image-tag"
echo "Image tag saved to .image-tag"