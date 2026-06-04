#!/usr/bin/env bash

deploy_monitoring() {
  echo "Deploying Monitoring Stack..."

  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true
  helm repo update

  helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --create-namespace \
    -f "${REPO_ROOT}/addons/monitoring/values.yaml" \
    --wait \
    --timeout 15m

  kubectl rollout status deployment/monitoring-kube-prometheus-operator \
    -n monitoring \
    --timeout=900s

  kubectl rollout status deployment/monitoring-grafana \
    -n monitoring \
    --timeout=900s

  echo "Monitoring Stack deployed successfully."
}