apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: argocd-repo-fullstack-cloud-platform
  namespace: argocd
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore

  target:
    name: private-repo-fullstack-cloud-platform
    creationPolicy: Owner
    template:
      metadata:
        labels:
          argocd.argoproj.io/secret-type: repository
      data:
        type: git
        url: ${GIT_REPO_URL}
        username: "{{ .username }}"
        password: "{{ .password }}"

  data:
    - secretKey: username
      remoteRef:
        key: ${PROJECT_NAME}/${ENVIRONMENT}/github/argocd-repo
        property: username

    - secretKey: password
      remoteRef:
        key: ${PROJECT_NAME}/${ENVIRONMENT}/github/argocd-repo
        property: password