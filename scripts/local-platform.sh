#!/usr/bin/env bash

set -euo pipefail

ACTION="${1:-status}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=scripts/local-common.sh
source "${SCRIPT_DIR}/local-common.sh"

load_local_config

run_make() {
  # Keep child Make/compose calls on the repository's normal project.env/config path handling.
  # local-common.sh uses absolute paths internally, but compose.sh treats PROJECT_ENV_FILE as repo-relative.
  env -u PROJECT_ENV_FILE -u LOCAL_CONFIG_FILE make "$@"
}

ensure_kind_cluster() {
  require_command kind
  require_command make

  if kind get clusters | grep -qx "${KIND_CLUSTER}"; then
    echo "Kind cluster already exists: ${KIND_CLUSTER}"
  else
    echo "Creating kind cluster: ${KIND_CLUSTER}"
    run_make local-k8s-up
  fi
}

wait_app_rollouts() {
  require_command kubectl

  echo "Waiting for app rollouts..."
  kubectl rollout status deployment/backend -n "${K8S_NAMESPACE}" --timeout=300s
  kubectl rollout status deployment/frontend -n "${K8S_NAMESPACE}" --timeout=300s
}

restart_app_for_latest_images() {
  require_command kubectl

  echo "Restarting app deployments so kind uses the freshly loaded latest images..."
  kubectl rollout restart deployment/backend -n "${K8S_NAMESPACE}"
  kubectl rollout restart deployment/frontend -n "${K8S_NAMESPACE}"
  wait_app_rollouts
}

wait_prometheus_backend_target() {
  require_command kubectl

  local query_url="http://${PROMETHEUS_SERVICE}.${MONITORING_NAMESPACE}.svc.cluster.local:${PROMETHEUS_SERVICE_PORT}/api/v1/query?query=up%7Bjob%3D%22backend%22%2Cnamespace%3D%22${K8S_NAMESPACE}%22%2Cservice%3D%22backend%22%7D"
  local result=""

  echo "Waiting for Prometheus backend target to be up..."
  echo "Prometheus service: ${PROMETHEUS_SERVICE}.${MONITORING_NAMESPACE}:${PROMETHEUS_SERVICE_PORT}"

  for i in $(seq 1 24); do
    echo "Attempt ${i}/24"

    result="$(
      kubectl exec -n "${K8S_NAMESPACE}" deployment/backend -- python -c "
import urllib.request
url = '${query_url}'
print(urllib.request.urlopen(url, timeout=10).read().decode())
" 2>/dev/null || true
    )"

    echo "${result}"

    if echo "${result}" | grep -q '"value".*"1"'; then
      echo "OK: Prometheus backend target is up."
      return 0
    fi

    sleep 10
  done

  echo "ERROR: Prometheus backend target did not become up in time."
  return 1
}

platform_links() {
  print_local_summary

  echo "Run these in separate terminals and keep them open:"
  echo
  echo "  make local-app-port-forward"
  echo "  make local-argocd-port-forward"
  echo "  make local-prometheus-port-forward"
  echo "  make local-grafana-port-forward"
  echo
  echo "Then open:"
  echo
  echo "  App:        http://localhost:${APP_ACCESS_LOCAL_PORT}"
  echo "  ArgoCD:     https://localhost:${ARGOCD_LOCAL_PORT}"
  echo "  Prometheus: http://localhost:${PROMETHEUS_LOCAL_PORT}"
  echo "  Grafana:    http://localhost:${GRAFANA_LOCAL_PORT}"
}

platform_status() {
  require_command kubectl
  require_command helm

  print_local_summary

  echo "Helm releases:"
  helm list -A || true

  echo
  echo "App resources:"
  kubectl get pods,svc,ingress,servicemonitor -n "${K8S_NAMESPACE}" || true

  echo
  echo "Monitoring resources:"
  kubectl get pods,svc -n "${MONITORING_NAMESPACE}" || true

  echo
  echo "ArgoCD resources:"
  kubectl get pods,svc,applications.argoproj.io -n "${ARGOCD_NAMESPACE}" || true

  echo
  platform_links
}

platform_refresh() {
  require_command make
  require_command kubectl
  require_command helm
  require_command docker
  require_command kind

  print_local_summary

  if ! kind get clusters | grep -qx "${KIND_CLUSTER}"; then
    echo "ERROR: Kind cluster does not exist: ${KIND_CLUSTER}"
    echo "Run: make local-platform-up"
    exit 1
  fi

  echo "Step 1/6: build local backend/frontend images"
  run_make local-k8s-build

  echo
  echo "Step 2/6: load images into kind"
  run_make local-k8s-load

  echo
  echo "Step 3/6: deploy app with monitoring override"
  run_make local-k8s-deploy-monitoring

  echo
  echo "Step 4/6: restart app deployments for latest images"
  restart_app_for_latest_images


  echo
  echo "Step 5/6: wait for Prometheus backend target"
  wait_prometheus_backend_target

  echo
  echo "Step 6/6: run local smoke test"
  run_make local-k8s-smoke-test

  echo
  echo "Local platform refresh completed."
}

platform_up() {
  require_command make
  require_command kubectl
  require_command helm
  require_command docker
  require_command kind

  print_local_summary

  echo "Step 1/8: create local kind cluster if needed"
  ensure_kind_cluster

  echo
  echo "Step 2/8: install local monitoring"
  run_make local-monitoring-up

  echo
  echo "Step 3/8: refresh app images, deploy app, validate metrics and smoke tests"
  platform_refresh

  echo
  echo "Step 4/8: install local ArgoCD"
  run_make local-argocd-up

  echo
  echo "Step 5/8: apply ArgoCD Application preview"
  run_make local-argocd-app-apply

  echo
  echo "Step 6/8: show platform status"
  platform_status

  echo
  echo "Step 7/8: show browser links"
  platform_links

  echo
  echo "Step 8/8: done"
  echo "Local platform is ready."
}

check_http_endpoint() {
  local name="$1"
  local url="$2"
  local port_forward_command="$3"
  local curl_args="$4"

  echo
  echo "Checking ${name}: ${url}"

  if ! bash -c "curl ${curl_args} --max-time 5 '${url}' >/tmp/local-platform-access-check.out 2>/tmp/local-platform-access-check.err"; then
    echo "MISSING or not ready: ${name}"
    echo "Start this in a separate terminal and keep it open:"
    echo "  ${port_forward_command}"
    echo "Error:"
    sed -n '1,20p' /tmp/local-platform-access-check.err || true
    return 1
  fi

  echo "OK: ${name}"
  sed -n '1,20p' /tmp/local-platform-access-check.out || true
}

platform_access_check() {
  require_command curl

  echo "Checking local browser access endpoints..."
  echo
  echo "Expected browser links:"
  echo "  App:        http://localhost:${APP_ACCESS_LOCAL_PORT}"
  echo "  ArgoCD:     https://localhost:${ARGOCD_LOCAL_PORT}"
  echo "  Prometheus: http://localhost:${PROMETHEUS_LOCAL_PORT}"
  echo "  Grafana:    http://localhost:${GRAFANA_LOCAL_PORT}"
  echo
  echo "Each link requires its matching port-forward command to be running in a separate terminal."

  local failed=0

  check_http_endpoint "App" "http://localhost:${APP_ACCESS_LOCAL_PORT}" "make local-app-port-forward" "-sS -I" || failed=1
  check_http_endpoint "ArgoCD" "https://localhost:${ARGOCD_LOCAL_PORT}" "make local-argocd-port-forward" "-k -sS -I" || failed=1
  check_http_endpoint "Prometheus" "http://localhost:${PROMETHEUS_LOCAL_PORT}/-/ready" "make local-prometheus-port-forward" "-sS" || failed=1
  check_http_endpoint "Grafana" "http://localhost:${GRAFANA_LOCAL_PORT}" "make local-grafana-port-forward" "-sS -I" || failed=1

  echo
  if [ "${failed}" -eq 0 ]; then
    echo "All local browser links are reachable."
  else
    echo "Some local browser links are not reachable because their port-forward command is not running."
    exit 1
  fi
}

platform_doctor() {
  require_command kubectl
  require_command helm

  local failed=0

  print_local_summary

  echo "Doctor check: Helm releases"
  helm list -A || failed=1

  echo
  echo "Doctor check: app rollouts"
  kubectl rollout status deployment/backend -n "${K8S_NAMESPACE}" --timeout=120s || failed=1
  kubectl rollout status deployment/frontend -n "${K8S_NAMESPACE}" --timeout=120s || failed=1

  echo
  echo "Doctor check: ServiceMonitor"
  kubectl get servicemonitor backend -n "${K8S_NAMESPACE}" -o yaml || failed=1


  echo
  echo "Doctor check: Prometheus backend target"
  wait_prometheus_backend_target || failed=1

  echo
  echo "Doctor check: local smoke test"
  run_make local-k8s-smoke-test || failed=1

  echo
  if [ "${failed}" -eq 0 ]; then
    echo "Local platform doctor passed."
  else
    echo "Local platform doctor found issues."
    exit 1
  fi
}

platform_down() {
  echo "Removing local platform demo..."
  run_make local-argocd-app-delete || true
  run_make local-argocd-down || true
  run_make local-monitoring-down || true
  run_make local-k8s-down || true
  echo "Local platform cleanup requested."
}

case "${ACTION}" in
  up) platform_up ;;
  refresh) platform_refresh ;;
  status) platform_status ;;
  links) platform_links ;;
  access-check) platform_access_check ;;
  doctor) platform_doctor ;;
  down) platform_down ;;
  *)
    echo "Usage: $0 {up|refresh|status|links|access-check|doctor|down}"
    exit 1
    ;;
esac
