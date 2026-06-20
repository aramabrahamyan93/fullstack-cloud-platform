#!/usr/bin/env bash

set -euo pipefail

ACTION="${1:-status}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MONITORING_NAMESPACE="${MONITORING_NAMESPACE:-monitoring}"
MONITORING_RELEASE="${MONITORING_RELEASE:-monitoring}"
MONITORING_VALUES="${MONITORING_VALUES:-${REPO_ROOT}/addons/monitoring/values.yaml}"

require_command() {
  local command_name="$1"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "ERROR: Required command is missing: ${command_name}"
    exit 1
  fi
}

monitoring_up() {
  require_command helm
  require_command kubectl

  echo "Installing local monitoring stack..."
  echo "Namespace: ${MONITORING_NAMESPACE}"
  echo "Release:   ${MONITORING_RELEASE}"
  echo "Values:    ${MONITORING_VALUES}"

  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true
  helm repo update

  helm upgrade --install "${MONITORING_RELEASE}" prometheus-community/kube-prometheus-stack \
    --namespace "${MONITORING_NAMESPACE}" \
    --create-namespace \
    -f "${MONITORING_VALUES}" \
    --wait \
    --timeout 15m

  kubectl rollout status deployment/"${MONITORING_RELEASE}"-kube-prometheus-operator \
    -n "${MONITORING_NAMESPACE}" \
    --timeout=900s

  kubectl rollout status deployment/"${MONITORING_RELEASE}"-grafana \
    -n "${MONITORING_NAMESPACE}" \
    --timeout=900s

  echo "Local monitoring stack is ready."
}

monitoring_status() {
  require_command helm
  require_command kubectl

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
  require_command kubectl

  echo "Uninstalling local monitoring stack..."
  helm uninstall "${MONITORING_RELEASE}" -n "${MONITORING_NAMESPACE}" || true

  echo "Local monitoring stack uninstall requested."
}

case "${ACTION}" in
  up)
    monitoring_up
    ;;
  status)
    monitoring_status
    ;;
  down)
    monitoring_down
    ;;
  *)
    echo "Usage: $0 {up|status|down}"
    exit 1
    ;;
esac
