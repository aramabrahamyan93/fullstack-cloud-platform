module "vpc" {
  count  = var.enable_vpc ? 1 : 0
  source = "../../modules/vpc"

  project_name         = var.project_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs

  enable_nat_gateway = var.enable_nat_gateway
}

module "eks" {
  count  = var.enable_vpc && var.enable_eks ? 1 : 0
  source = "../../modules/eks"

  project_name       = var.project_name
  environment        = var.environment
  private_subnet_ids = module.vpc[0].private_subnet_ids

  cluster_version     = var.eks_cluster_version
  node_instance_types = var.eks_node_instance_types
  node_desired_size   = var.eks_node_desired_size
  node_min_size       = var.eks_node_min_size
  node_max_size       = var.eks_node_max_size
  node_subnet_ids     = var.enable_nat_gateway ? module.vpc[0].private_subnet_ids : module.vpc[0].public_subnet_ids
}

locals {
  github_actions_deploy_role_arn = "arn:aws:iam::${var.account_id}:role/${var.github_actions_deploy_role_name}"
}

resource "aws_eks_access_entry" "github_actions_deploy" {
  count = var.enable_eks ? 1 : 0

  cluster_name  = module.eks[0].cluster_name
  principal_arn = local.github_actions_deploy_role_arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "github_actions_deploy_admin" {
  count = var.enable_eks ? 1 : 0

  cluster_name  = module.eks[0].cluster_name
  principal_arn = local.github_actions_deploy_role_arn
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

  access_scope {
    type = "cluster"
  }

  depends_on = [
    aws_eks_access_entry.github_actions_deploy
  ]
}

locals {
  external_secrets_namespace       = "external-secrets"
  external_secrets_service_account = "external-secrets"

  eks_oidc_issuer_url = var.enable_eks ? module.eks[0].cluster_oidc_issuer_url : ""
  eks_oidc_provider   = var.enable_eks ? replace(local.eks_oidc_issuer_url, "https://", "") : ""
}

data "tls_certificate" "eks_oidc" {
  count = var.enable_eks && var.enable_external_secrets_irsa ? 1 : 0

  url = local.eks_oidc_issuer_url
}

resource "aws_iam_openid_connect_provider" "eks" {
  count = var.enable_eks && var.enable_external_secrets_irsa ? 1 : 0

  url = local.eks_oidc_issuer_url

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = [
    data.tls_certificate.eks_oidc[0].certificates[0].sha1_fingerprint
  ]

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

data "aws_iam_policy_document" "external_secrets_assume_role" {
  count = var.enable_eks && var.enable_external_secrets_irsa ? 1 : 0

  statement {
    effect = "Allow"

    actions = [
      "sts:AssumeRoleWithWebIdentity"
    ]

    principals {
      type = "Federated"
      identifiers = [
        aws_iam_openid_connect_provider.eks[0].arn
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.eks_oidc_provider}:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.eks_oidc_provider}:sub"
      values = [
        "system:serviceaccount:${local.external_secrets_namespace}:${local.external_secrets_service_account}"
      ]
    }
  }
}

resource "aws_iam_role" "external_secrets" {
  count = var.enable_eks && var.enable_external_secrets_irsa ? 1 : 0

  name = "${var.project_name}-${var.environment}-external-secrets-role"

  assume_role_policy = data.aws_iam_policy_document.external_secrets_assume_role[0].json

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

data "aws_iam_policy_document" "external_secrets_permissions" {
  count = var.enable_eks && var.enable_external_secrets_irsa ? 1 : 0

  statement {
    effect = "Allow"

    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]

    resources = [
      "arn:aws:secretsmanager:${var.aws_region}:${var.account_id}:secret:${var.project_name}/${var.environment}/rds/postgres-*",
      "arn:aws:secretsmanager:${var.aws_region}:${var.account_id}:secret:${var.project_name}/${var.environment}/github/argocd-repo*"
    ]
  }
}

resource "aws_iam_policy" "external_secrets" {
  count = var.enable_eks && var.enable_external_secrets_irsa ? 1 : 0

  name   = "${var.project_name}-${var.environment}-external-secrets-policy"
  policy = data.aws_iam_policy_document.external_secrets_permissions[0].json

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_role_policy_attachment" "external_secrets" {
  count = var.enable_eks && var.enable_external_secrets_irsa ? 1 : 0

  role       = aws_iam_role.external_secrets[0].name
  policy_arn = aws_iam_policy.external_secrets[0].arn
}

module "rds" {
  count  = var.enable_vpc && var.enable_rds ? 1 : 0
  source = "../../modules/rds"

  project_name = var.project_name
  environment  = var.environment

  vpc_id             = module.vpc[0].vpc_id
  private_subnet_ids = module.vpc[0].private_subnet_ids

  allowed_cidr_blocks = [
    var.vpc_cidr
  ]

  db_name     = var.db_name
  db_username = var.db_username

  deletion_protection            = var.rds_deletion_protection
  skip_final_snapshot            = var.rds_skip_final_snapshot
  backup_retention_days          = var.rds_backup_retention_days
  secret_recovery_window_in_days = var.secret_recovery_window_in_days
}

resource "aws_secretsmanager_secret" "argocd_repo_credentials" {
  name = "${var.project_name}/${var.environment}/github/argocd-repo"

  recovery_window_in_days = 0

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
