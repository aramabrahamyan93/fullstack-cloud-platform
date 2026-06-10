#!/usr/bin/env bash
set -euo pipefail

K8S_NAMESPACE="${K8S_NAMESPACE:-fullstack-local}"

BACKEND_DEPLOYMENT="${BACKEND_DEPLOYMENT:-backend}"
BACKEND_SERVICE_URL="${BACKEND_SERVICE_URL:-http://localhost:8000}"
FRONTEND_SERVICE_URL="${FRONTEND_SERVICE_URL:-http://frontend:80}"

SMOKE_TEST_RESPONSE_FILE="${SMOKE_TEST_RESPONSE_FILE:-/tmp/k8s-smoke-response.txt}"
SMOKE_TEST_EMAIL="k8s-smoke-$(date +%s)@example.com"
SMOKE_TEST_PASSWORD="strong-password"

echo "Local Kubernetes smoke test"
echo "Namespace:            ${K8S_NAMESPACE}"
echo "Backend deployment:   ${BACKEND_DEPLOYMENT}"
echo "Backend URL in pod:   ${BACKEND_SERVICE_URL}"
echo "Frontend service URL: ${FRONTEND_SERVICE_URL}"
echo

run_backend_curl_check() {
  local name="$1"
  local url="$2"

  echo "Checking ${name}: ${url}"

  kubectl exec "deployment/${BACKEND_DEPLOYMENT}" \
    -n "${K8S_NAMESPACE}" \
    -c backend \
    -- curl -fsS --max-time 5 "${url}" > "${SMOKE_TEST_RESPONSE_FILE}"

  echo "OK: ${name}"
  echo
}

run_backend_curl_status_check() {
  local name="$1"
  local url="$2"
  local expected_status_code="$3"
  local authorization_header="${4:-}"

  echo "Checking ${name}: ${url}"

  local curl_args=(
    -sS
    --max-time 5
  )

  if [ -n "${authorization_header}" ]; then
    curl_args+=(-H "Authorization: Bearer ${authorization_header}")
  fi

  local raw_response
  raw_response="$(
    kubectl exec "deployment/${BACKEND_DEPLOYMENT}" \
      -n "${K8S_NAMESPACE}" \
      -c backend \
      -- curl "${curl_args[@]}" \
        -w "__HTTP_STATUS__%{http_code}" \
        "${url}"
  )"

  local status_code
  local response_body

  status_code="${raw_response##*__HTTP_STATUS__}"
  response_body="${raw_response%__HTTP_STATUS__*}"

  printf "%s" "${response_body}" > "${SMOKE_TEST_RESPONSE_FILE}"

  if [ "${status_code}" != "${expected_status_code}" ]; then
    echo "ERROR: ${name} failed. status=${status_code}, expected=${expected_status_code}"
    echo "Response:"
    cat "${SMOKE_TEST_RESPONSE_FILE}" 2>/dev/null || true
    exit 1
  fi

  echo "OK: ${name}"
  echo
}

run_backend_curl_post_status_check() {
  local name="$1"
  local url="$2"
  local json_body="$3"
  local expected_status_code="$4"
  local authorization_header="${5:-}"

  echo "Checking ${name}: ${url}"

  local curl_args=(
    -sS
    --max-time 5
    -X POST
    -H "Content-Type: application/json"
    -d "${json_body}"
  )

  if [ -n "${authorization_header}" ]; then
    curl_args+=(-H "Authorization: Bearer ${authorization_header}")
  fi

  local raw_response
  raw_response="$(
    kubectl exec "deployment/${BACKEND_DEPLOYMENT}" \
      -n "${K8S_NAMESPACE}" \
      -c backend \
      -- curl "${curl_args[@]}" \
        -w "__HTTP_STATUS__%{http_code}" \
        "${url}"
  )"

  local status_code
  local response_body

  status_code="${raw_response##*__HTTP_STATUS__}"
  response_body="${raw_response%__HTTP_STATUS__*}"

  printf "%s" "${response_body}" > "${SMOKE_TEST_RESPONSE_FILE}"

  if [ "${status_code}" != "${expected_status_code}" ]; then
    echo "ERROR: ${name} failed. status=${status_code}, expected=${expected_status_code}"
    echo "Response:"
    cat "${SMOKE_TEST_RESPONSE_FILE}" 2>/dev/null || true
    exit 1
  fi

  echo "OK: ${name}"
  echo
}

extract_access_token() {
  python -c 'import json, sys; print(json.load(sys.stdin)["access_token"])' < "${SMOKE_TEST_RESPONSE_FILE}"
}

register_smoke_user() {
  local base_url="$1"

  run_backend_curl_post_status_check \
    "register smoke user" \
    "${base_url}/auth/register" \
    "{\"email\":\"${SMOKE_TEST_EMAIL}\",\"password\":\"${SMOKE_TEST_PASSWORD}\"}" \
    "201"
}

login_smoke_user() {
  local base_url="$1"

  run_backend_curl_post_status_check \
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

  run_backend_curl_status_check \
    "${route_prefix} tasks require authentication" \
    "${base_url}/tasks" \
    "401"

  run_backend_curl_status_check \
    "${route_prefix} tasks with authentication" \
    "${base_url}/tasks" \
    "200" \
    "${access_token}"

  run_backend_curl_post_status_check \
    "${route_prefix} create task with authentication" \
    "${base_url}/tasks" \
    '{"title":"Created by Kubernetes smoke test","status":"open"}' \
    "201" \
    "${access_token}"

  run_backend_curl_status_check \
    "${route_prefix} tasks after create with authentication" \
    "${base_url}/tasks" \
    "200" \
    "${access_token}"
}

echo "Waiting for backend rollout..."
kubectl rollout status "deployment/${BACKEND_DEPLOYMENT}" \
  -n "${K8S_NAMESPACE}" \
  --timeout=120s

echo
run_backend_curl_check "backend health" "${BACKEND_SERVICE_URL}/health"
run_backend_curl_check "backend liveness" "${BACKEND_SERVICE_URL}/health/live"
run_backend_curl_check "backend readiness" "${BACKEND_SERVICE_URL}/health/ready"
run_backend_curl_check "backend version" "${BACKEND_SERVICE_URL}/version"
run_backend_curl_check "backend metrics" "${BACKEND_SERVICE_URL}/metrics"

register_smoke_user "${BACKEND_SERVICE_URL}"
login_smoke_user "${BACKEND_SERVICE_URL}"

run_backend_curl_status_check \
  "backend current user with authentication" \
  "${BACKEND_SERVICE_URL}/auth/me" \
  "200" \
  "${ACCESS_TOKEN}"

check_protected_tasks_flow "${BACKEND_SERVICE_URL}" "backend" "${ACCESS_TOKEN}"

run_backend_curl_check "frontend service" "${FRONTEND_SERVICE_URL}"
run_backend_curl_check "frontend API proxy health" "${FRONTEND_SERVICE_URL}/api/health"
run_backend_curl_check "frontend API proxy liveness" "${FRONTEND_SERVICE_URL}/api/health/live"
run_backend_curl_check "frontend API proxy readiness" "${FRONTEND_SERVICE_URL}/api/health/ready"

run_backend_curl_status_check \
  "frontend API proxy current user with authentication" \
  "${FRONTEND_SERVICE_URL}/api/auth/me" \
  "200" \
  "${ACCESS_TOKEN}"

check_protected_tasks_flow "${FRONTEND_SERVICE_URL}/api" "frontend API proxy" "${ACCESS_TOKEN}"

echo "Local Kubernetes smoke test completed successfully."