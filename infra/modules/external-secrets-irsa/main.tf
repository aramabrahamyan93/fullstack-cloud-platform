locals {
  role_name = "${var.project_name}-${var.environment}-external-secrets"

  oidc_provider_host = replace(var.oidc_provider_url, "https://", "")

  service_account_subject = "system:serviceaccount:${var.service_account_namespace}:${var.service_account_name}"
}

resource "aws_iam_role" "this" {
  name = local.role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = var.oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${local.oidc_provider_host}:sub" = local.service_account_subject
            "${local.oidc_provider_host}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_role_policy" "secrets_manager_read" {
  name = "${local.role_name}-secrets-manager-read"
  role = aws_iam_role.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${var.account_id}:secret:${var.secret_name_prefix}*"
      }
    ]
  })
}