#!/usr/bin/env bash

set -euo pipefail

ACTION="${1:-status}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=scripts/local-common.sh
source "${SCRIPT_DIR}/local-common.sh"

load_local_config

helm_release_status() {
  local release_name="$1"
  local namespace="$2"

  helm status "${release_name}" -n "${namespace}" 2>/dev/null | awk '/^STATUS:/ { print $2 }' || true
}

cleanup_failed_release_if_needed() {
  local release_name="$1"
  local namespace="$2"
  local status

  status="$(helm_release_status "${release_name}" "${namespace}")"

  if [ -z "${status}" ]; then
    echo "Helm release does not exist yet: ${release_name}/${namespace}"
    return 0
  fi

  echo "Current Helm release status for ${release_name}/${namespace}: ${status}"

  case "${status}" in
    failed|pending-install|pending-upgrade|pending-rollback|uninstalling)
      echo "Cleaning failed/pending local Helm release before retry: ${release_name}/${namespace}"
      helm uninstall "${release_name}" -n "${namespace}" --wait --timeout 10m || true
      ;;
    *)
      echo "Helm release status is reusable: ${release_name}/${namespace}"
      ;;
  esac
}

monitoring_up() {
  require_command helm
  require_command kubectl

  echo "Installing local monitoring stack..."
  print_local_summary
  echo "Monitoring namespace: ${MONITORING_NAMESPACE}"
  echo "Monitoring release:   ${MONITORING_RELEASE}"
  echo "Monitoring values:    ${MONITORING_VALUES_PATH}"
  echo "Monitoring chart:     kube-prometheus-stack ${MONITORING_CHART_VERSION}"

  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true
  helm repo update

  cleanup_failed_release_if_needed "${MONITORING_RELEASE}" "${MONITORING_NAMESPACE}"

  helm upgrade --install "${MONITORING_RELEASE}" prometheus-community/kube-prometheus-stack \
    --namespace "${MONITORING_NAMESPACE}" \
    --create-namespace \
    -f "${MONITORING_VALUES_PATH}" \
    --version "${MONITORING_CHART_VERSION}" \
    --wait \
    --timeout 15m

  kubectl rollout status deployment/"${MONITORING_RELEASE}"-kube-prometheus-operator -n "${MONITORING_NAMESPACE}" --timeout=900s
  kubectl rollout status deployment/"${MONITORING_RELEASE}"-grafana -n "${MONITORING_NAMESPACE}" --timeout=900s

  echo "Local monitoring stack is ready."
}

monitoring_status() {
  require_command helm
  require_command kubectl

  print_local_summary

  echo "Monitoring Helm releases:"
  helm list -n "${MONITORING_NAMESPACE}" || true

  echo
  echo "Monitoring namespace resources:"
  kubectl get pods,svc -n "${MONITORING_NAMESPACE}" || true

  echo
  echo "Monitoring CRDs:"
  kubectl get crd servicemonitors.monitoring.coreos.com 2>/dev/null || true
  kubectl get crd prometheuses.monitoring.coreos.com 2>/dev/null || true
  kubectl get crd podmonitors.monitoring.coreos.com 2>/dev/null || true
}

monitoring_down() {
  require_command helm

  echo "Uninstalling local monitoring stack..."
  helm uninstall "${MONITORING_RELEASE}" -n "${MONITORING_NAMESPACE}" || true
  echo "Local monitoring stack uninstall requested."
}

prometheus_port_forward() {
  require_command kubectl

  echo "Opening Prometheus UI on: http://localhost:${PROMETHEUS_LOCAL_PORT}"
  echo "Press Ctrl+C to stop the port-forward."
  kubectl -n "${MONITORING_NAMESPACE}" port-forward "svc/${PROMETHEUS_SERVICE}" "${PROMETHEUS_LOCAL_PORT}:${PROMETHEUS_SERVICE_PORT}"
}

grafana_port_forward() {
  require_command kubectl

  echo "Opening Grafana UI on: http://localhost:${GRAFANA_LOCAL_PORT}"
  echo "Press Ctrl+C to stop the port-forward."
  kubectl -n "${MONITORING_NAMESPACE}" port-forward "svc/${GRAFANA_SERVICE}" "${GRAFANA_LOCAL_PORT}:${GRAFANA_SERVICE_PORT}"
}

case "${ACTION}" in
  up) monitoring_up ;;
  status) monitoring_status ;;
  down) monitoring_down ;;
  prometheus-port-forward) prometheus_port_forward ;;
  grafana-port-forward) grafana_port_forward ;;
  *)
    echo "Usage: $0 {up|status|down|prometheus-port-forward|grafana-port-forward}"
    exit 1
    ;;
esac
