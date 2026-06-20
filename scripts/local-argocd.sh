#!/usr/bin/env bash

set -euo pipefail

ACTION="${1:-status}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARGOCD_NAMESPACE="${ARGOCD_NAMESPACE:-argocd}"
ARGOCD_RELEASE="${ARGOCD_RELEASE:-argocd}"
ARGOCD_VALUES="${ARGOCD_VALUES:-${REPO_ROOT}/addons/argocd/values.yaml}"

require_command() {
  local command_name="$1"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "ERROR: Required command is missing: ${command_name}"
    exit 1
  fi
}

argocd_up() {
  require_command helm
  require_command kubectl

  echo "Installing local ArgoCD..."
  echo "Namespace: ${ARGOCD_NAMESPACE}"
  echo "Release:   ${ARGOCD_RELEASE}"
  echo "Values:    ${ARGOCD_VALUES}"

  helm repo add argo https://argoproj.github.io/argo-helm || true
  helm repo update

  helm upgrade --install "${ARGOCD_RELEASE}" argo/argo-cd \
    --namespace "${ARGOCD_NAMESPACE}" \
    --create-namespace \
    -f "${ARGOCD_VALUES}" \
    --wait \
    --timeout 10m

  kubectl rollout status statefulset/"${ARGOCD_RELEASE}"-application-controller \
    -n "${ARGOCD_NAMESPACE}" \
    --timeout=600s

  kubectl rollout status deployment/"${ARGOCD_RELEASE}"-server \
    -n "${ARGOCD_NAMESPACE}" \
    --timeout=600s

  kubectl rollout status deployment/"${ARGOCD_RELEASE}"-repo-server \
    -n "${ARGOCD_NAMESPACE}" \
    --timeout=600s

  kubectl rollout status deployment/"${ARGOCD_RELEASE}"-redis \
    -n "${ARGOCD_NAMESPACE}" \
    --timeout=600s

  echo "Local ArgoCD is ready."
}

argocd_status() {
  require_command helm
  require_command kubectl

  echo "ArgoCD Helm releases:"
  helm list -n "${ARGOCD_NAMESPACE}" || true

  echo
  echo "ArgoCD namespace resources:"
  kubectl get pods,svc -n "${ARGOCD_NAMESPACE}" || true

  echo
  echo "ArgoCD CRDs:"
  kubectl get crd applications.argoproj.io 2>/dev/null || true
  kubectl get crd appprojects.argoproj.io 2>/dev/null || true
  kubectl get crd applicationsets.argoproj.io 2>/dev/null || true
}

argocd_down() {
  require_command helm
  require_command kubectl

  echo "Uninstalling local ArgoCD..."
  helm uninstall "${ARGOCD_RELEASE}" -n "${ARGOCD_NAMESPACE}" || true

  echo "Local ArgoCD uninstall requested."
}

argocd_app_render() {
  require_command envsubst

  export GIT_REPO_URL="${GIT_REPO_URL:-$(git -C "${REPO_ROOT}" config --get remote.origin.url)}"
  export GIT_TARGET_REVISION="${GIT_TARGET_REVISION:-develop}"

  envsubst < "${REPO_ROOT}/addons/argocd/applications/local-app.yaml.tpl"
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

  echo "Deleting local ArgoCD Application preview..."
  kubectl delete application fullstack-local -n "${ARGOCD_NAMESPACE}" --ignore-not-found=true
  echo "Local ArgoCD Application preview delete requested."
}

argocd_app_status() {
  require_command kubectl

  echo "Local ArgoCD Applications:"
  kubectl get applications.argoproj.io -n "${ARGOCD_NAMESPACE}" || true

  echo
  echo "Local fullstack Application details:"
  kubectl get application fullstack-local -n "${ARGOCD_NAMESPACE}" -o yaml || true
}


case "${ACTION}" in
  up)
    argocd_up
    ;;
  status)
    argocd_status
    ;;
  down)
    argocd_down
    ;;
  app-render)
    argocd_app_render
    ;;
  app-apply)
    argocd_app_apply
    ;;
  app-status)
    argocd_app_status
    ;;
  app-delete)
    argocd_app_delete
    ;;
  *)
    echo "Usage: $0 {up|status|down|app-render|app-apply|app-status|app-delete}"
    exit 1
    ;;
esac
