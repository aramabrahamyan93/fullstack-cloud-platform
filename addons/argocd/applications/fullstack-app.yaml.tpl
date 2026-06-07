apiVersion: argoproj.io/v1alpha1
kind: Application

metadata:
  name: ${RELEASE_PREFIX}-${ENVIRONMENT}
  namespace: argocd

spec:
  project: default

  source:
    repoURL: ${GIT_REPO_URL}
    targetRevision: ${GIT_TARGET_REVISION}
    path: helm/platform

    helm:
      valueFiles:
        - values-${ENVIRONMENT}.yaml

      parameters:
        - name: namespace
          value: ${RELEASE_PREFIX}-${ENVIRONMENT}

        - name: global.projectName
          value: ${PROJECT_NAME}

        - name: global.domain
          value: ${PROJECT_NAME}.local

        - name: global.awsAccountId
          value: "${AWS_ACCOUNT_ID}"

        - name: global.awsRegion
          value: ${AWS_REGION}

  destination:
    server: https://kubernetes.default.svc
    namespace: ${RELEASE_PREFIX}-${ENVIRONMENT}

  syncPolicy:
    automated:
      prune: true
      selfHeal: true

    syncOptions:
      - CreateNamespace=true