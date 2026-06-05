#!/usr/bin/env bash

get_ingress_nginx_helm_status() {
  helm status ingress-nginx -n ingress-nginx 2>/dev/null | awk '/^STATUS:/ { print $2 }' || true
}

cleanup_ingress_nginx_admission_hooks() {
  echo "Cleaning old ingress-nginx admission hook jobs if they exist..."

  kubectl delete job ingress-nginx-admission-create \
    -n ingress-nginx \
    --ignore-not-found=true

  kubectl delete job ingress-nginx-admission-patch \
    -n ingress-nginx \
    --ignore-not-found=true
}

cleanup_failed_ingress_nginx_release_if_needed() {
  local status
  status="$(get_ingress_nginx_helm_status)"

  if [ -z "${status}" ]; then
    echo "Ingress NGINX Helm release does not exist yet."
    cleanup_ingress_nginx_admission_hooks
    return
  fi

  echo "Current Ingress NGINX Helm release status: ${status}"

  case "${status}" in
    failed|pending-install|pending-upgrade|pending-rollback)
      echo "Ingress NGINX Helm release is in a failed/pending state. Cleaning it up before retry..."
      helm uninstall ingress-nginx -n ingress-nginx --wait --timeout 10m || true
      cleanup_ingress_nginx_admission_hooks
      echo "Ingress NGINX Helm release cleanup completed."
      ;;
    *)
      echo "Ingress NGINX Helm release status is reusable."
      cleanup_ingress_nginx_admission_hooks
      ;;
  esac
}

deploy_ingress_nginx() {
  echo "Deploying Ingress NGINX..."

  cleanup_failed_ingress_nginx_release_if_needed

  helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx || true
  helm repo update

  helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
    --namespace ingress-nginx \
    --create-namespace \
    -f "${REPO_ROOT}/addons/ingress-nginx/values.yaml" \
    --wait \
    --timeout 15m

  kubectl rollout status deployment/ingress-nginx-controller \
    -n ingress-nginx \
    --timeout=900s

  echo "Ingress NGINX deployed successfully."
}