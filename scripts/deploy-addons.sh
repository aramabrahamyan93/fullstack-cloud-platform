#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=scripts/addons/common.sh
source "${SCRIPT_DIR}/addons/common.sh"
# shellcheck source=scripts/addons/external-secrets.sh
source "${SCRIPT_DIR}/addons/external-secrets.sh"
# shellcheck source=scripts/addons/argocd.sh
source "${SCRIPT_DIR}/addons/argocd.sh"
# shellcheck source=scripts/addons/ingress-nginx.sh
source "${SCRIPT_DIR}/addons/ingress-nginx.sh"
# shellcheck source=scripts/addons/monitoring.sh
source "${SCRIPT_DIR}/addons/monitoring.sh"
# shellcheck source=scripts/addons/logging.sh
source "${SCRIPT_DIR}/addons/logging.sh"
# shellcheck source=scripts/addons/argo-rollouts.sh
source "${SCRIPT_DIR}/addons/argo-rollouts.sh"

load_addons_config
print_addons_summary
validate_common_config

require_command helm
require_command kubectl
require_command envsubst

if [ "${ENABLE_EXTERNAL_SECRETS}" = "true" ]; then
  deploy_external_secrets
  deploy_external_secrets_store
else
  echo "External Secrets disabled."
fi

if [ "${ENABLE_INGRESS_NGINX}" = "true" ]; then
  deploy_ingress_nginx
else
  echo "Ingress NGINX disabled."
fi

# Important:
# Monitoring must be deployed before ArgoCD Application when the application Helm chart
# creates ServiceMonitor resources. Otherwise ArgoCD/Helm sync can fail with:
# "no matches for kind ServiceMonitor in version monitoring.coreos.com/v1".
if [ "${ENABLE_MONITORING}" = "true" ]; then
  deploy_monitoring
else
  echo "Monitoring disabled."
fi

if [ "${ENABLE_ARGOCD}" = "true" ]; then
  deploy_argocd

  if [ "${ENABLE_EXTERNAL_SECRETS}" = "true" ]; then
    deploy_argocd_repo_credentials
  else
    echo "Skipping ArgoCD repository credentials because External Secrets is disabled."
  fi
else
  echo "ArgoCD disabled."
fi

if [ "${ENABLE_ARGOCD_APPLICATION}" = "true" ]; then
  if [ "${ENABLE_ARGOCD}" != "true" ]; then
    echo "ERROR: ENABLE_ARGOCD_APPLICATION=true requires ENABLE_ARGOCD=true"
    exit 1
  fi

  if [ "${ENABLE_MONITORING}" != "true" ]; then
    echo "WARNING: ENABLE_ARGOCD_APPLICATION=true but ENABLE_MONITORING=false."
    echo "WARNING: If the app Helm chart renders ServiceMonitor, ArgoCD sync may fail unless ServiceMonitor CRDs already exist."
  fi

  deploy_argocd_application
else
  echo "ArgoCD Application disabled."
fi

if [ "${ENABLE_ARGO_ROLLOUTS}" = "true" ]; then
  deploy_argo_rollouts
else
  echo "Argo Rollouts disabled."
fi

if [ "${ENABLE_LOGGING}" = "true" ]; then
  deploy_logging
else
  echo "Logging disabled."
fi

echo
echo "Addons deployment completed."