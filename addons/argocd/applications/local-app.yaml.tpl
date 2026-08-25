apiVersion: argoproj.io/v1alpha1
kind: Application

metadata:
  name: ${ARGOCD_APP_NAME}
  namespace: ${ARGOCD_NAMESPACE}

spec:
  project: ${ARGOCD_PROJECT}

  source:
    repoURL: ${GIT_REPO_URL}
    targetRevision: ${GIT_TARGET_REVISION}
    path: ${ARGOCD_APP_SOURCE_PATH}

    helm:
      releaseName: ${ARGOCD_APP_RELEASE_NAME}

      valueFiles:
${ARGOCD_APP_VALUE_FILES_BLOCK}

      parameters:
        - name: namespace
          value: ${ARGOCD_APP_DESTINATION_NAMESPACE}

        - name: global.projectName
          value: ${PROJECT_NAME}

        - name: global.domain
          value: ${PROJECT_DOMAIN}

        - name: global.awsAccountId
          value: "${AWS_ACCOUNT_ID}"

        - name: global.awsRegion
          value: ${AWS_REGION}

  destination:
    server: ${ARGOCD_DESTINATION_SERVER}
    namespace: ${ARGOCD_APP_DESTINATION_NAMESPACE}

  syncPolicy:
    syncOptions:
      - CreateNamespace=true
