#!/usr/bin/env bash

deploy_ingress_nginx() {
  echo "Deploying Ingress NGINX..."

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