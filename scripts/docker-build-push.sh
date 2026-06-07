#!/usr/bin/env bash

set -euo pipefail

ACCOUNT="${ACCOUNT:-}"
AWS_PROFILE="${AWS_PROFILE:-}"
AWS_REGION="${AWS_REGION:-}"
PROJECT_NAME="${PROJECT_NAME:-}"
IMAGE_TAG="${IMAGE_TAG:-}"
SERVICE="${SERVICE:-}"
SERVICES="${SERVICES:-}"
DRY_RUN="${DRY_RUN:-false}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SERVICES_FILE="${SERVICES_FILE:-${REPO_ROOT}/services.json}"

if [ -f "${REPO_ROOT}/project.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/project.env"
  set +a
fi

AWS_REGION="${AWS_REGION:-eu-central-1}"

require_command() {
  local command_name="$1"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "ERROR: Required command is missing: ${command_name}"
    exit 1
  fi
}

is_true() {
  local value="${1:-false}"

  case "${value}" in
    true|TRUE|True|1|yes|YES|Yes)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

should_include_service() {
  local service_name="$1"

  if [ -n "${SERVICE}" ] && [ "${service_name}" != "${SERVICE}" ]; then
    return 1
  fi

  if [ -n "${SERVICES}" ]; then
    IFS=',' read -ra selected_services <<< "${SERVICES}"

    for selected_service in "${selected_services[@]}"; do
      selected_service="$(echo "${selected_service}" | xargs)"

      if [ "${service_name}" = "${selected_service}" ]; then
        return 0
      fi
    done

    return 1
  fi

  return 0
}

run_command() {
  echo "+ $*"

  if is_true "${DRY_RUN}"; then
    return 0
  fi

  "$@"
}

validate_config() {
  require_command jq
  require_command docker

  if ! is_true "${DRY_RUN}"; then
    require_command aws
  fi

  if [ ! -f "${SERVICES_FILE}" ]; then
    echo "ERROR: services file not found: ${SERVICES_FILE}"
    exit 1
  fi

  jq empty "${SERVICES_FILE}"

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

  if [ -z "${AWS_PROFILE}" ] && [ "${CI:-false}" != "true" ] && ! is_true "${DRY_RUN}"; then
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
}

print_summary() {
  echo "Docker build and push"
  echo "Environment:     ${ENV}"
  echo "Account:         ${ACCOUNT}"
  echo "AWS Profile:     ${AWS_PROFILE:-default/CI}"
  echo "AWS Account ID:  ${AWS_ACCOUNT_ID}"
  echo "AWS Region:      ${AWS_REGION}"
  echo "Project Name:    ${PROJECT_NAME}"
  echo "Image Tag:       ${IMAGE_TAG}"
  echo "ECR Registry:    ${ECR_REGISTRY}"
  echo "Services file:   ${SERVICES_FILE}"
  echo "SERVICE filter:  ${SERVICE:-<none>}"
  echo "SERVICES filter: ${SERVICES:-<none>}"
  echo "Dry run:         ${DRY_RUN}"
  echo
}

login_to_ecr() {
  if is_true "${DRY_RUN}"; then
    echo "Skipping ECR login because DRY_RUN=true."
    echo
    return 0
  fi

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

  echo
}

build_and_push_service() {
  local service_json="$1"

  local service_name
  local service_type
  local service_context
  local service_dockerfile
  local service_image
  local service_enabled
  local service_build
  local service_push

  service_name="$(echo "${service_json}" | jq -r '.name')"
  service_type="$(echo "${service_json}" | jq -r '.type // "unknown"')"
  service_context="$(echo "${service_json}" | jq -r '.context')"
  service_dockerfile="$(echo "${service_json}" | jq -r '.dockerfile // "Dockerfile"')"
  service_image="$(echo "${service_json}" | jq -r '.image // .name')"
  service_enabled="$(echo "${service_json}" | jq -r '.enabled // true')"
  service_build="$(echo "${service_json}" | jq -r '.build // true')"
  service_push="$(echo "${service_json}" | jq -r '.push // true')"

  if [ "${service_name}" = "null" ] || [ -z "${service_name}" ]; then
    echo "ERROR: service entry is missing name."
    exit 1
  fi

  if ! should_include_service "${service_name}"; then
    echo "Skipping ${service_name}: filtered out."
    echo
    return 0
  fi

  if [ "${service_enabled}" != "true" ]; then
    echo "Skipping ${service_name}: enabled=false."
    echo
    return 0
  fi

  if [ "${service_build}" != "true" ]; then
    echo "Skipping ${service_name}: build=false."
    echo
    return 0
  fi

  local absolute_context
  absolute_context="${REPO_ROOT}/${service_context#./}"

  local dockerfile_path
  dockerfile_path="${absolute_context}/${service_dockerfile}"

  if [ ! -d "${absolute_context}" ]; then
    echo "ERROR: context directory not found for ${service_name}: ${absolute_context}"
    exit 1
  fi

  if [ ! -f "${dockerfile_path}" ]; then
    echo "ERROR: Dockerfile not found for ${service_name}: ${dockerfile_path}"
    exit 1
  fi

  local local_repo
  local remote_repo
  local local_image
  local remote_image

  local_repo="${PROJECT_NAME}-${service_image}"
  remote_repo="${PROJECT_NAME}-${service_image}"

  local_image="${local_repo}:${IMAGE_TAG}"
  remote_image="${ECR_REGISTRY}/${remote_repo}:${IMAGE_TAG}"

  echo "Service:         ${service_name}"
  echo "Type:            ${service_type}"
  echo "Context:         ${absolute_context}"
  echo "Dockerfile:      ${dockerfile_path}"
  echo "Local image:     ${local_image}"
  echo "Remote image:    ${remote_image}"
  echo "Push enabled:    ${service_push}"
  echo

  run_command docker build \
    -f "${dockerfile_path}" \
    -t "${local_image}" \
    "${absolute_context}"

  run_command docker tag \
    "${local_image}" \
    "${remote_image}"

  if [ "${service_push}" = "true" ]; then
    run_command docker push "${remote_image}"
  else
    echo "Skipping push for ${service_name}: push=false."
  fi

  echo "${remote_image}" >> "${REPO_ROOT}/.image-tags"
  echo
}

validate_config
print_summary
login_to_ecr

rm -f "${REPO_ROOT}/.image-tags"

mapfile -t service_entries < <(
  jq -c '.[]' "${SERVICES_FILE}"
)

if [ "${#service_entries[@]}" -eq 0 ]; then
  echo "ERROR: no services found in ${SERVICES_FILE}"
  exit 1
fi

for service_entry in "${service_entries[@]}"; do
  build_and_push_service "${service_entry}"
done

echo "${IMAGE_TAG}" > "${REPO_ROOT}/.image-tag"

echo "Docker build and push completed."
echo "Image tag saved to .image-tag"
echo "Built image list saved to .image-tags"

if [ -f "${REPO_ROOT}/.image-tags" ]; then
  echo
  echo "Images:"
  cat "${REPO_ROOT}/.image-tags"
fi