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

format_helm_value_files() {
  local value_file

  for value_file in ${ARGOCD_APP_VALUE_FILES}; do
    printf '        - %s\n' "${value_file}"
  done
}

argocd_up() {
  require_command helm
  require_command kubectl

  echo "Installing local ArgoCD..."
  print_local_summary
  echo "ArgoCD namespace: ${ARGOCD_NAMESPACE}"
  echo "ArgoCD release:   ${ARGOCD_RELEASE}"
  echo "ArgoCD values:    ${ARGOCD_VALUES_PATH}"
  echo "ArgoCD chart:     argo-cd ${ARGOCD_CHART_VERSION}"

  helm repo add argo https://argoproj.github.io/argo-helm || true
  helm repo update

  cleanup_failed_release_if_needed "${ARGOCD_RELEASE}" "${ARGOCD_NAMESPACE}"

  helm upgrade --install "${ARGOCD_RELEASE}" argo/argo-cd \
    --namespace "${ARGOCD_NAMESPACE}" \
    --create-namespace \
    -f "${ARGOCD_VALUES_PATH}" \
    --version "${ARGOCD_CHART_VERSION}" \
    --wait \
    --timeout 10m

  kubectl rollout status statefulset/"${ARGOCD_RELEASE}"-application-controller -n "${ARGOCD_NAMESPACE}" --timeout=600s
  kubectl rollout status deployment/"${ARGOCD_RELEASE}"-server -n "${ARGOCD_NAMESPACE}" --timeout=600s
  kubectl rollout status deployment/"${ARGOCD_RELEASE}"-repo-server -n "${ARGOCD_NAMESPACE}" --timeout=600s
  kubectl rollout status deployment/"${ARGOCD_RELEASE}"-redis -n "${ARGOCD_NAMESPACE}" --timeout=600s

  echo "Local ArgoCD is ready."
}

argocd_status() {
  require_command helm
  require_command kubectl

  print_local_summary

  echo "ArgoCD Helm releases:"
  helm list -n "${ARGOCD_NAMESPACE}" || true

  echo
  echo "ArgoCD namespace resources:"
  kubectl get pods,svc -n "${ARGOCD_NAMESPACE}" || true

  echo
  echo "ArgoCD Applications:"
  kubectl get applications.argoproj.io -n "${ARGOCD_NAMESPACE}" || true
}

argocd_down() {
  require_command helm

  echo "Uninstalling local ArgoCD..."
  helm uninstall "${ARGOCD_RELEASE}" -n "${ARGOCD_NAMESPACE}" || true
  echo "Local ArgoCD uninstall requested."
}

argocd_app_render() {
  require_command envsubst

  export ARGOCD_APP_VALUE_FILES_BLOCK
  ARGOCD_APP_VALUE_FILES_BLOCK="$(format_helm_value_files)"

  envsubst < "${ARGOCD_APP_TEMPLATE_PATH}"
}

argocd_app_apply() {
  require_command kubectl
  require_command envsubst

  local rendered_file="${REPO_ROOT}/tmp/local-argocd-app-rendered-apply.yaml"

  mkdir -p "${REPO_ROOT}/tmp"

  echo "Applying local ArgoCD Application preview..."
  argocd_app_render > "${rendered_file}"

  echo "Rendered Application manifest: ${rendered_file}"
  kubectl apply -f "${rendered_file}"

  echo "Local ArgoCD Application preview applied."
}

argocd_app_delete() {
  require_command kubectl

  echo "Deleting local ArgoCD Application preview: ${ARGOCD_APP_NAME}"
  kubectl delete application "${ARGOCD_APP_NAME}" -n "${ARGOCD_NAMESPACE}" --ignore-not-found=true
  echo "Local ArgoCD Application preview delete requested."
}

argocd_app_status() {
  require_command kubectl

  echo "Local ArgoCD Applications:"
  kubectl get applications.argoproj.io -n "${ARGOCD_NAMESPACE}" || true

  echo
  echo "Local Application details:"
  kubectl get application "${ARGOCD_APP_NAME}" -n "${ARGOCD_NAMESPACE}" -o yaml || true
}

argocd_port_forward() {
  require_command kubectl

  echo "Opening ArgoCD UI on: https://localhost:${ARGOCD_LOCAL_PORT}"
  echo "Press Ctrl+C to stop the port-forward."
  kubectl -n "${ARGOCD_NAMESPACE}" port-forward "svc/${ARGOCD_RELEASE}-server" "${ARGOCD_LOCAL_PORT}:443"
}

case "${ACTION}" in
  up) argocd_up ;;
  status) argocd_status ;;
  down) argocd_down ;;
  app-render) argocd_app_render ;;
  app-apply) argocd_app_apply ;;
  app-status) argocd_app_status ;;
  app-delete) argocd_app_delete ;;
  port-forward) argocd_port_forward ;;
  *)
    echo "Usage: $0 {up|status|down|app-render|app-apply|app-status|app-delete|port-forward}"
    exit 1
    ;;
esac
