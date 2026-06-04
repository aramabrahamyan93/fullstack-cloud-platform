#!/usr/bin/env bash

deploy_argocd() {
  echo "Deploying ArgoCD..."

  helm repo add argo https://argoproj.github.io/argo-helm || true
  helm repo update

  helm upgrade --install argocd argo/argo-cd \
    --namespace argocd \
    --create-namespace \
    -f "${REPO_ROOT}/addons/argocd/values.yaml" \
    --wait \
    --timeout 10m

  kubectl rollout status statefulset/argocd-application-controller \
    -n argocd \
    --timeout=600s

  kubectl rollout status deployment/argocd-server \
    -n argocd \
    --timeout=600s

  kubectl rollout status deployment/argocd-repo-server \
    -n argocd \
    --timeout=600s

  kubectl rollout status deployment/argocd-redis \
    -n argocd \
    --timeout=600s

  echo "ArgoCD deployed successfully."
}

deploy_argocd_repo_credentials() {
  local template_file="${REPO_ROOT}/addons/argocd/repository-external-secret.yaml.tpl"

  if [ ! -f "${template_file}" ]; then
    echo "ERROR: ArgoCD repository ExternalSecret template does not exist: ${template_file}"
    exit 1
  fi

  echo "Deploying ArgoCD repository credentials ExternalSecret..."

  export ENVIRONMENT="${ACCOUNT_ENV}"
  export PROJECT_NAME
  export GIT_REPO_URL

  envsubst < "${template_file}" | kubectl apply -f -

  echo "ArgoCD repository credentials ExternalSecret applied successfully."

  echo "Waiting for ArgoCD repository secret to be created..."
  kubectl wait \
    --namespace argocd \
    --for=condition=Ready \
    externalsecret/argocd-repo-fullstack-cloud-platform \
    --timeout=300s

  kubectl get secret private-repo-fullstack-cloud-platform -n argocd >/dev/null

  echo "ArgoCD repository secret is ready."
}

deploy_argocd_application() {
  local template_file="${REPO_ROOT}/addons/argocd/applications/fullstack-app.yaml.tpl"

  if [ ! -f "${template_file}" ]; then
    echo "ERROR: ArgoCD application template does not exist: ${template_file}"
    exit 1
  fi

  echo "Deploying ArgoCD Application for environment: ${ACCOUNT_ENV}"

  export ENVIRONMENT="${ACCOUNT_ENV}"
  export PROJECT_NAME
  export AWS_REGION
  export AWS_ACCOUNT_ID
  export GIT_REPO_URL
  export GIT_TARGET_REVISION

  envsubst < "${template_file}" | kubectl apply -f -

  echo "ArgoCD Application applied successfully."
}