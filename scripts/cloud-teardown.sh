#!/usr/bin/env bash

set -euo pipefail

ACCOUNT="${ACCOUNT:-}"
AWS_PROFILE="${AWS_PROFILE:-}"
AWS_REGION="${AWS_REGION:-}"
PROJECT_NAME="${PROJECT_NAME:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ -f "${REPO_ROOT}/project.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/project.env"
  set +a
fi

AWS_REGION="${AWS_REGION:-eu-central-1}"

if [ -z "${ACCOUNT}" ]; then
  echo "ERROR: ACCOUNT is required. Example: ACCOUNT=dev-859981975099"
  exit 1
fi

if [[ ! "${ACCOUNT}" =~ ^([a-zA-Z0-9_-]+)-([0-9]{12})$ ]]; then
  echo "ERROR: ACCOUNT must match format: {ENV}-{AWS_ACCOUNT_ID}"
  exit 1
fi

ACCOUNT_ENV="${BASH_REMATCH[1]}"
AWS_ACCOUNT_ID="${BASH_REMATCH[2]}"

if [ -z "${AWS_PROFILE}" ]; then
  echo "ERROR: AWS_PROFILE is required. Example: AWS_PROFILE=aram-dev"
  exit 1
fi

if [ -z "${PROJECT_NAME}" ]; then
  echo "ERROR: PROJECT_NAME is required. Set it in project.env or pass PROJECT_NAME=..."
  exit 1
fi

CLUSTER_NAME="${PROJECT_NAME}-${ACCOUNT_ENV}"
APP_NAMESPACE="fullstack-${ACCOUNT_ENV}"
HELM_RELEASE="fullstack-${ACCOUNT_ENV}"

echo "Cloud teardown"
echo "Environment:    ${ACCOUNT_ENV}"
echo "Account:        ${ACCOUNT}"
echo "AWS Profile:    ${AWS_PROFILE}"
echo "AWS Account ID: ${AWS_ACCOUNT_ID}"
echo "AWS Region:     ${AWS_REGION}"
echo "Project Name:   ${PROJECT_NAME}"
echo "Cluster Name:   ${CLUSTER_NAME}"
echo "Namespace:      ${APP_NAMESPACE}"

cleanup_classic_elbs_for_vpc() {
  local vpc_id="$1"

  echo "Checking Classic ELBs in VPC: ${vpc_id}"

  local elb_names
  elb_names="$(aws elb describe-load-balancers \
    --region "${AWS_REGION}" \
    --profile "${AWS_PROFILE}" \
    --query "LoadBalancerDescriptions[?VPCId=='${vpc_id}'].LoadBalancerName" \
    --output text || true)"

  if [ -z "${elb_names}" ]; then
    echo "OK: No Classic ELBs found."
    return 0
  fi

  for elb_name in ${elb_names}; do
    echo "Deleting Classic ELB: ${elb_name}"
    aws elb delete-load-balancer \
      --region "${AWS_REGION}" \
      --profile "${AWS_PROFILE}" \
      --load-balancer-name "${elb_name}" || true
  done

  echo "Waiting 60 seconds for Classic ELB cleanup..."
  sleep 60
}

cleanup_orphan_k8s_security_groups_for_vpc() {
  local vpc_id="$1"

  echo "Checking orphan Kubernetes ELB security groups in VPC: ${vpc_id}"

  local sg_ids
  sg_ids="$(aws ec2 describe-security-groups \
    --region "${AWS_REGION}" \
    --profile "${AWS_PROFILE}" \
    --filters Name=vpc-id,Values="${vpc_id}" \
    --query "SecurityGroups[?starts_with(GroupName, 'k8s-elb-')].GroupId" \
    --output text || true)"

  if [ -z "${sg_ids}" ]; then
    echo "OK: No orphan Kubernetes ELB security groups found."
    return 0
  fi

  for sg_id in ${sg_ids}; do
    echo "Checking security group attachments: ${sg_id}"

    local eni_count
    eni_count="$(aws ec2 describe-network-interfaces \
      --region "${AWS_REGION}" \
      --profile "${AWS_PROFILE}" \
      --filters Name=group-id,Values="${sg_id}" \
      --query "length(NetworkInterfaces)" \
      --output text || echo "1")"

    if [ "${eni_count}" = "0" ]; then
      echo "Deleting orphan security group: ${sg_id}"
      aws ec2 delete-security-group \
        --region "${AWS_REGION}" \
        --profile "${AWS_PROFILE}" \
        --group-id "${sg_id}" || true
    else
      echo "WARNING: Security group ${sg_id} is still attached to ${eni_count} network interface(s)."
    fi
  done
}

cleanup_vpc_dependencies() {
  local vpc_id="$1"

  if [ -z "${vpc_id}" ] || [ "${vpc_id}" = "None" ]; then
    echo "No VPC ID provided for dependency cleanup."
    return 0
  fi

  cleanup_classic_elbs_for_vpc "${vpc_id}"
  cleanup_orphan_k8s_security_groups_for_vpc "${vpc_id}"

  echo "Checking remaining ENIs in VPC: ${vpc_id}"
  aws ec2 describe-network-interfaces \
    --region "${AWS_REGION}" \
    --profile "${AWS_PROFILE}" \
    --filters Name=vpc-id,Values="${vpc_id}" \
    --query "NetworkInterfaces[*].[NetworkInterfaceId,Status,Description]" \
    --output table || true
}


echo "Checking if EKS cluster exists..."
if aws eks describe-cluster \
  --name "${CLUSTER_NAME}" \
  --region "${AWS_REGION}" \
  --profile "${AWS_PROFILE}" >/dev/null 2>&1; then

  echo "Updating kubeconfig..."
  aws eks update-kubeconfig \
    --region "${AWS_REGION}" \
    --name "${CLUSTER_NAME}" \
    --profile "${AWS_PROFILE}"

  echo "Uninstalling application Helm release..."
  helm uninstall "${HELM_RELEASE}" -n "${APP_NAMESPACE}" || true

  echo "Uninstalling ingress-nginx..."
  helm uninstall ingress-nginx -n ingress-nginx || true

  echo "Uninstalling external-secrets..."
  helm uninstall external-secrets -n external-secrets || true

  echo "Deleting namespaces..."
  kubectl delete namespace "${APP_NAMESPACE}" --ignore-not-found=true || true
  kubectl delete namespace ingress-nginx --ignore-not-found=true || true
  kubectl delete namespace external-secrets --ignore-not-found=true || true

  echo "Waiting for Kubernetes LoadBalancer cleanup..."
  sleep 90
else
  echo "EKS cluster does not exist. Skipping Kubernetes cleanup."
fi

echo "IMPORTANT: Terraform will remove EKS/RDS only if these are false in infra/accounts/${ACCOUNT}.tfvars:"
echo "  enable_eks = false"
echo "  enable_rds = false"

echo "Resolving current VPC ID from Terraform state, if available..."
CURRENT_VPC_ID="$(
  cd "${REPO_ROOT}/infra/stacks/platform" && \
  env AWS_PROFILE="${AWS_PROFILE}" terraform output -raw vpc_id 2>/dev/null || true
)"

if [ -n "${CURRENT_VPC_ID}" ]; then
  cleanup_vpc_dependencies "${CURRENT_VPC_ID}"
fi

echo "Applying Terraform platform stack..."
make tf-apply STACK=platform ACCOUNT="${ACCOUNT}" AWS_PROFILE="${AWS_PROFILE}"

echo "Verifying paid resource cleanup..."

echo "Checking EKS..."
if aws eks describe-cluster \
  --name "${CLUSTER_NAME}" \
  --region "${AWS_REGION}" \
  --profile "${AWS_PROFILE}" >/dev/null 2>&1; then
  echo "WARNING: EKS cluster still exists: ${CLUSTER_NAME}"
else
  echo "OK: EKS cluster deleted."
fi

echo "Checking RDS..."
if aws rds describe-db-instances \
  --db-instance-identifier "${CLUSTER_NAME}" \
  --region "${AWS_REGION}" \
  --profile "${AWS_PROFILE}" >/dev/null 2>&1; then
  echo "WARNING: RDS instance still exists: ${CLUSTER_NAME}"
else
  echo "OK: RDS instance deleted."
fi

echo "Checking LoadBalancers..."
aws elbv2 describe-load-balancers \
  --region "${AWS_REGION}" \
  --profile "${AWS_PROFILE}" \
  --query "LoadBalancers[?contains(LoadBalancerName, 'k8s')].[LoadBalancerName,DNSName,State.Code]" \
  --output table || true

echo "Checking running EC2 instances..."
aws ec2 describe-instances \
  --region "${AWS_REGION}" \
  --profile "${AWS_PROFILE}" \
  --filters Name=instance-state-name,Values=running,pending \
  --query "Reservations[*].Instances[*].[InstanceId,InstanceType,State.Name,Tags[?Key=='Name']|[0].Value]" \
  --output table || true

echo "Checking NAT Gateways..."
aws ec2 describe-nat-gateways \
  --region "${AWS_REGION}" \
  --profile "${AWS_PROFILE}" \
  --query "NatGateways[?State!='deleted'].[NatGatewayId,State,VpcId]" \
  --output table || true

echo "Checking available EBS volumes..."
aws ec2 describe-volumes \
  --region "${AWS_REGION}" \
  --profile "${AWS_PROFILE}" \
  --filters Name=status,Values=available \
  --query "Volumes[*].[VolumeId,Size,State,AvailabilityZone]" \
  --output table || true

echo "Cloud teardown completed."