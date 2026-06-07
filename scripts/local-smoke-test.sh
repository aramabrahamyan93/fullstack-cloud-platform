#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:3000}"
CHECK_FRONTEND="${CHECK_FRONTEND:-true}"
SMOKE_TEST_ATTEMPTS="${SMOKE_TEST_ATTEMPTS:-30}"
SMOKE_TEST_RESPONSE_FILE="${SMOKE_TEST_RESPONSE_FILE:-/tmp/local-smoke-response.txt}"
SMOKE_TEST_ERROR_FILE="${SMOKE_TEST_ERROR_FILE:-/tmp/local-smoke-error.txt}"

echo "Local smoke test"
echo "Backend URL:  ${BACKEND_URL}"
echo "Frontend URL: ${FRONTEND_URL}"
echo "Check frontend: ${CHECK_FRONTEND}"
echo "Attempts: ${SMOKE_TEST_ATTEMPTS}"
echo

wait_for_endpoint() {
  local name="$1"
  local url="$2"

  echo "Checking ${name}: ${url}"

  for attempt in $(seq 1 "${SMOKE_TEST_ATTEMPTS}"); do
    rm -f "${SMOKE_TEST_RESPONSE_FILE}" "${SMOKE_TEST_ERROR_FILE}"

    local status_code
    status_code="$(
      curl -sS \
        --max-time 5 \
        -o "${SMOKE_TEST_RESPONSE_FILE}" \
        -w "%{http_code}" \
        "${url}" \
        2>"${SMOKE_TEST_ERROR_FILE}" || true
    )"

    if [ "${status_code}" = "200" ]; then
      echo "OK: ${name}"
      echo
      return 0
    fi

    echo "  attempt ${attempt}/${SMOKE_TEST_ATTEMPTS}, status=${status_code}"

    if [ "${attempt}" != "${SMOKE_TEST_ATTEMPTS}" ]; then
      sleep 1
    fi
  done

  echo
  echo "ERROR: ${name} failed."
  echo "URL: ${url}"
  echo
  echo "Last curl error:"
  cat "${SMOKE_TEST_ERROR_FILE}" 2>/dev/null || true
  echo
  echo "Last response:"
  cat "${SMOKE_TEST_RESPONSE_FILE}" 2>/dev/null || true
  echo

  exit 1
}

wait_for_endpoint "backend health" "${BACKEND_URL}/health"
wait_for_endpoint "backend version" "${BACKEND_URL}/version"
wait_for_endpoint "backend metrics" "${BACKEND_URL}/metrics"

if [ "${CHECK_FRONTEND}" = "true" ]; then
  wait_for_endpoint "frontend" "${FRONTEND_URL}"
else
  echo "Skipping frontend check."
fi

echo "Local smoke test completed successfully."