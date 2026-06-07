#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

PROJECT_ENV_FILE="${PROJECT_ENV_FILE:-project.env}"
PROJECT_ENV_FILE_PATH="${REPO_ROOT}/${PROJECT_ENV_FILE}"

if [ ! -f "${PROJECT_ENV_FILE_PATH}" ]; then
  echo "ERROR: project env file not found: ${PROJECT_ENV_FILE_PATH}"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${PROJECT_ENV_FILE_PATH}"
set +a

if [ -z "${PROJECT_NAME:-}" ]; then
  echo "ERROR: PROJECT_NAME is required in ${PROJECT_ENV_FILE_PATH}"
  exit 1
fi

cd "${REPO_ROOT}"

MSYS_NO_PATHCONV=1 \
MSYS2_ARG_CONV_EXCL="*" \
docker compose \
  --env-file "${PROJECT_ENV_FILE}" \
  -p "${PROJECT_NAME}" \
  "$@"