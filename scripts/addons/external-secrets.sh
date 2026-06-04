#!/usr/bin/env bash

deploy_external_secrets() {
  echo "Deploying External Secrets..."

  local external_secrets_role_arn="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${PROJECT_NAME}-${ACCOUNT_ENV}-external-secrets-role"

  helm repo add external-secrets https://charts.external-secrets.io || true
  helm repo update

  helm upgrade --install external-secrets external-secrets/external-secrets \
    --namespace external-secrets \
    --create-namespace \
    -f "${REPO_ROOT}/addons/external-secrets/values.yaml" \
    --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="${external_secrets_role_arn}" \
    --wait \
    --timeout 10m

  kubectl rollout status deployment/external-secrets \
    -n external-secrets \
    --timeout=600s

  kubectl rollout status deployment/external-secrets-webhook \
    -n external-secrets \
    --timeout=600s

  kubectl rollout status deployment/external-secrets-cert-controller \
    -n external-secrets \
    --timeout=600s

  echo "External Secrets deployed successfully."
}

deploy_external_secrets_store() {
  local template_file="${REPO_ROOT}/addons/external-secrets/cluster-secret-store.yaml.tpl"

  if [ ! -f "${template_file}" ]; then
    echo "ERROR: External Secrets ClusterSecretStore template does not exist: ${template_file}"
    exit 1
  fi

  echo "Deploying External Secrets ClusterSecretStore..."

  export AWS_REGION

  envsubst < "${template_file}" | kubectl apply -f -

  echo "External Secrets ClusterSecretStore applied successfully."
}