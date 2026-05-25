#!/usr/bin/env bash

set -euo pipefail

ACCOUNT_ID="${ACCOUNT_ID:-}"
AWS_REGION="${AWS_REGION:-eu-central-1}"
AWS_PROFILE="${AWS_PROFILE:-}"
PROJECT_NAME="${PROJECT_NAME:-fullstack-cloud-platform}"

STATE_BUCKET="${STATE_BUCKET:-${ACCOUNT_ID}-tf-state}"
LOCK_TABLE="${LOCK_TABLE:-terraform-locks}"

if [ -z "$ACCOUNT_ID" ]; then
  echo "ERROR: ACCOUNT_ID is required."
  exit 1
fi

AWS_CMD="aws"

if [ -n "$AWS_PROFILE" ]; then
  AWS_CMD="aws --profile ${AWS_PROFILE}"
fi

echo "Bootstrapping Terraform remote state"
echo "Account ID:    ${ACCOUNT_ID}"
echo "AWS Region:    ${AWS_REGION}"
echo "AWS Profile:   ${AWS_PROFILE:-default}"
echo "State Bucket:  ${STATE_BUCKET}"
echo "Lock Table:    ${LOCK_TABLE}"
echo "Project Name:  ${PROJECT_NAME}"

echo "Checking S3 bucket..."
if $AWS_CMD s3api head-bucket --bucket "${STATE_BUCKET}" 2>/dev/null; then
  echo "S3 bucket already exists: ${STATE_BUCKET}"
else
  echo "Creating S3 bucket: ${STATE_BUCKET}"

  if [ "${AWS_REGION}" = "us-east-1" ]; then
    $AWS_CMD s3api create-bucket \
      --bucket "${STATE_BUCKET}" \
      --region "${AWS_REGION}"
  else
    $AWS_CMD s3api create-bucket \
      --bucket "${STATE_BUCKET}" \
      --region "${AWS_REGION}" \
      --create-bucket-configuration LocationConstraint="${AWS_REGION}"
  fi
fi

echo "Enabling S3 bucket versioning..."
$AWS_CMD s3api put-bucket-versioning \
  --bucket "${STATE_BUCKET}" \
  --versioning-configuration Status=Enabled

echo "Enabling S3 bucket encryption..."
$AWS_CMD s3api put-bucket-encryption \
  --bucket "${STATE_BUCKET}" \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'

echo "Blocking public access on S3 bucket..."
$AWS_CMD s3api put-public-access-block \
  --bucket "${STATE_BUCKET}" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "Checking DynamoDB lock table..."
if $AWS_CMD dynamodb describe-table \
  --table-name "${LOCK_TABLE}" \
  --region "${AWS_REGION}" >/dev/null 2>&1; then
  echo "DynamoDB table already exists: ${LOCK_TABLE}"
else
  echo "Creating DynamoDB lock table: ${LOCK_TABLE}"

  $AWS_CMD dynamodb create-table \
    --table-name "${LOCK_TABLE}" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "${AWS_REGION}"

  echo "Waiting for DynamoDB table to become active..."
  $AWS_CMD dynamodb wait table-exists \
    --table-name "${LOCK_TABLE}" \
    --region "${AWS_REGION}"
fi

echo "Terraform remote state bootstrap completed successfully."