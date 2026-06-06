#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
CHECK_FRONTEND="${CHECK_FRONTEND:-true}"

echo "Local smoke test"
echo "Backend URL:  ${BACKEND_URL}"
echo "Frontend URL: ${FRONTEND_URL}"
echo "Check frontend: ${CHECK_FRONTEND}"
echo

check_endpoint() {
  local name="$1"
  local url="$2"

  echo "Checking ${name}: ${url}"

  local status_code
  status_code="$(curl -s -o /tmp/local-smoke-response.txt -w "%{http_code}" "${url}" || true)"

  if [ "${status_code}" != "200" ]; then
    echo "ERROR: ${name} failed with HTTP status ${status_code}"
    echo "Response:"
    cat /tmp/local-smoke-response.txt || true
    exit 1
  fi

  echo "OK: ${name}"
  echo
}

check_endpoint "backend health" "${BACKEND_URL}/health"
check_endpoint "backend version" "${BACKEND_URL}/version"
check_endpoint "backend metrics" "${BACKEND_URL}/metrics"

if [ "${CHECK_FRONTEND}" = "true" ]; then
  check_endpoint "frontend" "${FRONTEND_URL}"
else
  echo "Skipping frontend check."
fi

echo "Local smoke test completed successfully."
