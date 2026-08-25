#!/usr/bin/env bash

set -euo pipefail

ACTION="${1:-status}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=scripts/local-common.sh
source "${SCRIPT_DIR}/local-common.sh"

load_local_config

app_access_status() {
  require_command kubectl

  print_local_summary

  echo "Local app access configuration:"
  echo "Namespace:    ${APP_ACCESS_NAMESPACE}"
  echo "Service:      ${APP_ACCESS_SERVICE}"
  echo "Local URL:    http://localhost:${APP_ACCESS_LOCAL_PORT}"
  echo "Service port: ${APP_ACCESS_SERVICE_PORT}"

  echo
  echo "App namespace resources:"
  kubectl get pods,svc,ingress -n "${APP_ACCESS_NAMESPACE}" || true
}

app_access_port_forward() {
  require_command kubectl

  echo "Opening app UI on: http://localhost:${APP_ACCESS_LOCAL_PORT}"
  echo "Press Ctrl+C to stop the port-forward."
  kubectl -n "${APP_ACCESS_NAMESPACE}" port-forward "svc/${APP_ACCESS_SERVICE}" "${APP_ACCESS_LOCAL_PORT}:${APP_ACCESS_SERVICE_PORT}"
}

case "${ACTION}" in
  status) app_access_status ;;
  port-forward) app_access_port_forward ;;
  *)
    echo "Usage: $0 {status|port-forward}"
    exit 1
    ;;
esac
