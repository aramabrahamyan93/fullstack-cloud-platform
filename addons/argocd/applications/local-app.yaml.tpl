apiVersion: argoproj.io/v1alpha1
kind: Application

metadata:
  name: fullstack-local
  namespace: argocd

spec:
  project: default

  source:
    repoURL: ${GIT_REPO_URL}
    targetRevision: ${GIT_TARGET_REVISION}
    path: helm/platform

    helm:
      releaseName: fullstack-local

      valueFiles:
        - values-local.yaml
        - values-local-monitoring.yaml

      parameters:
        - name: namespace
          value: fullstack-local

        - name: global.projectName
          value: fullstack-cloud-platform

        - name: global.domain
          value: fullstack-cloud-platform.local

        - name: global.awsAccountId
          value: ""

        - name: global.awsRegion
          value: eu-central-1

  destination:
    server: https://kubernetes.default.svc
    namespace: fullstack-local

  syncPolicy:
    syncOptions:
      - CreateNamespace=true
