#!/usr/bin/env bash

get_argocd_helm_status() {
  helm status argocd -n argocd 2>/dev/null | awk '/^STATUS:/ { print $2 }' || true
}

cleanup_failed_argocd_release_if_needed() {
  local status
  status="$(get_argocd_helm_status)"

  if [ -z "${status}" ]; then
    echo "ArgoCD Helm release does not exist yet."
    return
  fi

  echo "Current ArgoCD Helm release status: ${status}"

  case "${status}" in
    failed|pending-install|pending-upgrade|pending-rollback)
      if [ "${AUTO_RECOVER_FAILED_HELM_RELEASES:-false}" != "true" ]; then
        echo "ERROR: ArgoCD Helm release is ${status}, but AUTO_RECOVER_FAILED_HELM_RELEASES is not true."
        echo "Refusing to automatically uninstall ArgoCD in environment: ${ACCOUNT_ENV}"
        echo "For dev only, set AUTO_RECOVER_FAILED_HELM_RELEASES=true in config/addons/${ACCOUNT_ENV}.env"
        exit 1
      fi

      echo "ArgoCD Helm release is in a non-recoverable/pending state. Cleaning it up before retry..."
      helm uninstall argocd -n argocd --wait --timeout 10m || true
      echo "ArgoCD Helm release cleanup completed."
      ;;
    *)
      echo "ArgoCD Helm release status is reusable."
      ;;
  esac
}

deploy_argocd() {
  echo "Deploying ArgoCD..."

  cleanup_failed_argocd_release_if_needed

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

  local repo_external_secret_name="argocd-repo-${PROJECT_NAME}"
  local repo_secret_name="private-repo-${PROJECT_NAME}"

  echo "Waiting for ArgoCD repository ExternalSecret to be ready: ${repo_external_secret_name}"
  kubectl wait \
    --namespace argocd \
    --for=condition=Ready \
    "externalsecret/${repo_external_secret_name}" \
    --timeout=300s

  kubectl get secret "${repo_secret_name}" -n argocd >/dev/null

  echo "ArgoCD repository secret is ready: ${repo_secret_name}"
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