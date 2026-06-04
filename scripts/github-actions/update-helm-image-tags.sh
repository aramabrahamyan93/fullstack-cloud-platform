#!/usr/bin/env bash

set -euo pipefail

IMAGE_TAG="$1"
SERVICES_JSON="$2"

export IMAGE_TAG

for service in $(jq -r '.[].name' "$SERVICES_JSON"); do
  echo "Updating ${service}.image.tag to ${IMAGE_TAG}"

  yq -i \
    ".${service}.image.tag = strenv(IMAGE_TAG)" \
    helm/platform/values-dev.yaml
done

git diff