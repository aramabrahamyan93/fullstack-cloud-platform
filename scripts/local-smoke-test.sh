#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:3000}"
CHECK_FRONTEND="${CHECK_FRONTEND:-true}"
CHECK_FRONTEND_API_PROXY="${CHECK_FRONTEND_API_PROXY:-true}"

SMOKE_TEST_ATTEMPTS="${SMOKE_TEST_ATTEMPTS:-30}"
SMOKE_TEST_RESPONSE_FILE="${SMOKE_TEST_RESPONSE_FILE:-/tmp/local-smoke-response.txt}"
SMOKE_TEST_ERROR_FILE="${SMOKE_TEST_ERROR_FILE:-/tmp/local-smoke-error.txt}"

SMOKE_TEST_EMAIL="smoke-$(date +%s)@example.com"
SMOKE_TEST_PASSWORD="strong-password"

echo "Local smoke test"
echo "Backend URL:              ${BACKEND_URL}"
echo "Frontend URL:             ${FRONTEND_URL}"
echo "Check frontend:           ${CHECK_FRONTEND}"
echo "Check frontend API proxy: ${CHECK_FRONTEND_API_PROXY}"
echo "Attempts:                 ${SMOKE_TEST_ATTEMPTS}"
echo

wait_for_endpoint() {
  local name="$1"
  local url="$2"
  local expected_status_code="${3:-200}"

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

    if [ "${status_code}" = "${expected_status_code}" ]; then
      echo "OK: ${name}"
      echo
      return 0
    fi

    echo "  attempt ${attempt}/${SMOKE_TEST_ATTEMPTS}, status=${status_code}"

    if [ "${attempt}" != "${SMOKE_TEST_ATTEMPTS}" ]; then
      sleep 1
    fi
  done

  print_failure "${name}" "${url}" "${expected_status_code}" "${status_code}"
}

check_get() {
  local name="$1"
  local url="$2"
  local expected_status_code="${3:-200}"
  local authorization_header="${4:-}"

  echo "Checking ${name}: ${url}"

  rm -f "${SMOKE_TEST_RESPONSE_FILE}" "${SMOKE_TEST_ERROR_FILE}"

  local curl_args=(
    -sS
    --max-time 5
    -o "${SMOKE_TEST_RESPONSE_FILE}"
    -w "%{http_code}"
  )

  if [ -n "${authorization_header}" ]; then
    curl_args+=(-H "Authorization: Bearer ${authorization_header}")
  fi

  local status_code
  status_code="$(
    curl "${curl_args[@]}" \
      "${url}" \
      2>"${SMOKE_TEST_ERROR_FILE}" || true
  )"

  if [ "${status_code}" = "${expected_status_code}" ]; then
    echo "OK: ${name}"
    echo
    return 0
  fi

  print_failure "${name}" "${url}" "${expected_status_code}" "${status_code}"
}

check_post_json() {
  local name="$1"
  local url="$2"
  local json_body="$3"
  local expected_status_code="${4:-200}"
  local authorization_header="${5:-}"

  echo "Checking ${name}: ${url}"

  rm -f "${SMOKE_TEST_RESPONSE_FILE}" "${SMOKE_TEST_ERROR_FILE}"

  local curl_args=(
    -sS
    --max-time 5
    -X POST
    -H "Content-Type: application/json"
    -d "${json_body}"
    -o "${SMOKE_TEST_RESPONSE_FILE}"
    -w "%{http_code}"
  )

  if [ -n "${authorization_header}" ]; then
    curl_args+=(-H "Authorization: Bearer ${authorization_header}")
  fi

  local status_code
  status_code="$(
    curl "${curl_args[@]}" \
      "${url}" \
      2>"${SMOKE_TEST_ERROR_FILE}" || true
  )"

  if [ "${status_code}" = "${expected_status_code}" ]; then
    echo "OK: ${name}"
    echo
    return 0
  fi

  print_failure "${name}" "${url}" "${expected_status_code}" "${status_code}"
}

check_patch_json() {
  local name="$1"
  local url="$2"
  local json_body="$3"
  local expected_status_code="${4:-200}"
  local authorization_header="${5:-}"

  echo "Checking ${name}: ${url}"

  rm -f "${SMOKE_TEST_RESPONSE_FILE}" "${SMOKE_TEST_ERROR_FILE}"

  local curl_args=(
    -sS
    --max-time 5
    -X PATCH
    -H "Content-Type: application/json"
    -d "${json_body}"
    -o "${SMOKE_TEST_RESPONSE_FILE}"
    -w "%{http_code}"
  )

  if [ -n "${authorization_header}" ]; then
    curl_args+=(-H "Authorization: Bearer ${authorization_header}")
  fi

  local status_code
  status_code="$(
    curl "${curl_args[@]}" \
      "${url}" \
      2>"${SMOKE_TEST_ERROR_FILE}" || true
  )"

  if [ "${status_code}" = "${expected_status_code}" ]; then
    echo "OK: ${name}"
    echo
    return 0
  fi

  print_failure "${name}" "${url}" "${expected_status_code}" "${status_code}"
}

extract_access_token() {
  python -c 'import json, sys; print(json.load(sys.stdin)["access_token"])' < "${SMOKE_TEST_RESPONSE_FILE}"
}

extract_json_field() {
  local field_name="$1"

  python -c 'import json, sys; print(json.load(sys.stdin)[sys.argv[1]])' "${field_name}" < "${SMOKE_TEST_RESPONSE_FILE}"
}

print_failure() {
  local name="$1"
  local url="$2"
  local expected_status_code="$3"
  local actual_status_code="$4"

  echo
  echo "ERROR: ${name} failed. status=${actual_status_code}, expected=${expected_status_code}"
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

register_smoke_user() {
  local base_url="$1"

  check_post_json \
    "register smoke user" \
    "${base_url}/auth/register" \
    "{\"email\":\"${SMOKE_TEST_EMAIL}\",\"password\":\"${SMOKE_TEST_PASSWORD}\"}" \
    "201"
}

login_smoke_user() {
  local base_url="$1"

  check_post_json \
    "login smoke user" \
    "${base_url}/auth/login" \
    "{\"email\":\"${SMOKE_TEST_EMAIL}\",\"password\":\"${SMOKE_TEST_PASSWORD}\"}" \
    "200"

  ACCESS_TOKEN="$(extract_access_token)"
}

check_protected_tasks_flow() {
  local base_url="$1"
  local route_prefix="$2"
  local access_token="$3"

  check_get \
    "${route_prefix} tasks require authentication" \
    "${base_url}/tasks" \
    "401"

  check_get \
    "${route_prefix} tasks with authentication" \
    "${base_url}/tasks" \
    "200" \
    "${access_token}"

  check_post_json \
    "${route_prefix} create task with authentication" \
    "${base_url}/tasks" \
    '{"title":"Created by local smoke test","status":"open"}' \
    "201" \
    "${access_token}"

  check_get \
    "${route_prefix} tasks after create with authentication" \
    "${base_url}/tasks" \
    "200" \
    "${access_token}"
}


check_workspace_audit_logs_flow() {
  local base_url="$1"
  local label="$2"
  local access_token="$3"
  local organization_id="$4"

  echo
  echo "Checking ${label} workspace audit logs: ${base_url}/organizations/${organization_id}/audit-logs"

  local response
  response="$(
    curl -sS \
      -H "Authorization: Bearer ${access_token}" \
      "${base_url}/organizations/${organization_id}/audit-logs"
  )"

  echo "${response}" | grep -q "workspace_renamed"
  echo "${response}" | grep -q "workspace_created"

  echo "OK: ${label} workspace audit logs"
}

check_workspace_rename_flow() {
  local base_url="$1"
  local route_prefix="$2"
  local access_token="$3"

  check_post_json \
    "${route_prefix} create workspace with authentication" \
    "${base_url}/organizations" \
    '{"name":"Smoke Workspace"}' \
    "201" \
    "${access_token}"

  local organization_id
  organization_id="$(extract_json_field "id")"
  SMOKE_LAST_WORKSPACE_ID="${organization_id}"

  check_patch_json \
    "${route_prefix} rename workspace with authentication" \
    "${base_url}/organizations/${organization_id}" \
    '{"name":"Smoke Workspace Renamed"}' \
    "200" \
    "${access_token}"

  check_get \
    "${route_prefix} get renamed workspace with authentication" \
    "${base_url}/organizations/${organization_id}" \
    "200" \
    "${access_token}"

  python -c 'import json, sys; data=json.load(open(sys.argv[1])); assert data["name"] == "Smoke Workspace Renamed", data' "${SMOKE_TEST_RESPONSE_FILE}"

  check_get \
    "${route_prefix} list workspaces after rename with authentication" \
    "${base_url}/organizations" \
    "200" \
    "${access_token}"

  python -c 'import json, sys; data=json.load(open(sys.argv[1])); assert any(item["name"] == "Smoke Workspace Renamed" for item in data), data' "${SMOKE_TEST_RESPONSE_FILE}"
}

wait_for_endpoint "backend health" "${BACKEND_URL}/health"
wait_for_endpoint "backend liveness" "${BACKEND_URL}/health/live"
wait_for_endpoint "backend readiness" "${BACKEND_URL}/health/ready"
wait_for_endpoint "backend version" "${BACKEND_URL}/version"
wait_for_endpoint "backend metrics" "${BACKEND_URL}/metrics"

register_smoke_user "${BACKEND_URL}"
login_smoke_user "${BACKEND_URL}"

check_get \
  "backend current user with authentication" \
  "${BACKEND_URL}/auth/me" \
  "200" \
  "${ACCESS_TOKEN}"

check_protected_tasks_flow "${BACKEND_URL}" "backend" "${ACCESS_TOKEN}"
check_workspace_rename_flow "${BACKEND_URL}" "backend" "${ACCESS_TOKEN}"
check_workspace_audit_logs_flow "${BACKEND_URL}" "backend" "${ACCESS_TOKEN}" "${SMOKE_LAST_WORKSPACE_ID}"

if [ "${CHECK_FRONTEND}" = "true" ]; then
  wait_for_endpoint "frontend" "${FRONTEND_URL}"

  if [ "${CHECK_FRONTEND_API_PROXY}" = "true" ]; then
    wait_for_endpoint "frontend API proxy health" "${FRONTEND_URL}/api/health"
    wait_for_endpoint "frontend API proxy liveness" "${FRONTEND_URL}/api/health/live"
    wait_for_endpoint "frontend API proxy readiness" "${FRONTEND_URL}/api/health/ready"

    check_get \
      "frontend API proxy current user with authentication" \
      "${FRONTEND_URL}/api/auth/me" \
      "200" \
      "${ACCESS_TOKEN}"

    check_protected_tasks_flow "${FRONTEND_URL}/api" "frontend API proxy" "${ACCESS_TOKEN}"
    check_workspace_rename_flow "${FRONTEND_URL}/api" "frontend API proxy" "${ACCESS_TOKEN}"
    check_workspace_audit_logs_flow "${FRONTEND_URL}/api" "frontend API proxy" "${ACCESS_TOKEN}" "${SMOKE_LAST_WORKSPACE_ID}"
  fi
else
  echo "Skipping frontend check."
fi

echo "Local smoke test completed successfully."