#!/usr/bin/env bash

set -euo pipefail

ENABLE_ARGOCD="${ENABLE_ARGOCD:-false}"
ENABLE_ARGO_ROLLOUTS="${ENABLE_ARGO_ROLLOUTS:-false}"
ENABLE_MONITORING="${ENABLE_MONITORING:-false}"
ENABLE_LOGGING="${ENABLE_LOGGING:-false}"

if [ "$ENABLE_ARGOCD" = "true" ]; then
  echo "Deploying ArgoCD..."
fi

if [ "$ENABLE_ARGO_ROLLOUTS" = "true" ]; then
  echo "Deploying Argo Rollouts..."
fi

if [ "$ENABLE_MONITORING" = "true" ]; then
  echo "Deploying Monitoring..."
fi

if [ "$ENABLE_LOGGING" = "true" ]; then
  echo "Deploying Logging..."
fi