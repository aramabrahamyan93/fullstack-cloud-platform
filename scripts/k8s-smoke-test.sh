#!/usr/bin/env bash
set -euo pipefail

K8S_NAMESPACE="${K8S_NAMESPACE:-fullstack-local}"

BACKEND_DEPLOYMENT="${BACKEND_DEPLOYMENT:-backend}"
BACKEND_SERVICE_URL="${BACKEND_SERVICE_URL:-http://localhost:8000}"
FRONTEND_SERVICE_URL="${FRONTEND_SERVICE_URL:-http://frontend:80}"

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
    -- curl -fsS --max-time 5 "${url}" >/tmp/k8s-smoke-response.txt

  echo "OK: ${name}"
  echo
}

echo "Waiting for backend rollout..."
kubectl rollout status "deployment/${BACKEND_DEPLOYMENT}" \
  -n "${K8S_NAMESPACE}" \
  --timeout=120s

echo
run_backend_curl_check "backend health" "${BACKEND_SERVICE_URL}/health"
run_backend_curl_check "backend version" "${BACKEND_SERVICE_URL}/version"
run_backend_curl_check "backend metrics" "${BACKEND_SERVICE_URL}/metrics"
run_backend_curl_check "frontend service" "${FRONTEND_SERVICE_URL}"

echo "Local Kubernetes smoke test completed successfully."