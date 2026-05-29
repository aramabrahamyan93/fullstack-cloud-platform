variable "aws_region" {
  type = string
}

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "account_id" {
  type = string
}

variable "availability_zones" {
  type = list(string)
}

variable "vpc_cidr" {
  type = string
}

variable "public_subnet_cidrs" {
  type = list(string)
}

variable "private_subnet_cidrs" {
  type = list(string)
}

variable "eks_cluster_version" {
  type = string
}

variable "eks_node_instance_types" {
  type = list(string)
}

variable "eks_node_desired_size" {
  type = number
}

variable "eks_node_min_size" {
  type = number
}

variable "eks_node_max_size" {
  type = number
}

variable "enable_nat_gateway" {
  description = "Whether to create NAT Gateway."
  type        = bool
}

variable "enable_eks" {
  description = "Whether to create EKS cluster and node group."
  type        = bool
}

variable "enable_rds" {
  description = "Whether to create RDS PostgreSQL."
  type        = bool
}

variable "db_name" {
  description = "PostgreSQL database name."
  type        = string
  default     = "app"
}

variable "db_username" {
  description = "PostgreSQL master username."
  type        = string
  default     = "app"
}

variable "rds_deletion_protection" {
  description = "Whether deletion protection is enabled for RDS."
  type        = bool
}

variable "rds_skip_final_snapshot" {
  description = "Whether to skip final snapshot when deleting RDS."
  type        = bool
}

variable "rds_backup_retention_days" {
  description = "Number of days to retain RDS automated backups."
  type        = number
}

variable "secret_recovery_window_in_days" {
  description = "Secrets Manager recovery window in days."
  type        = number
  default     = 30
}

variable "enable_external_secrets_irsa" {
  description = "Enable IRSA role for External Secrets Operator."
  type        = bool
  default     = true
}

variable "github_actions_deploy_role_name" {
  description = "GitHub Actions deploy role name."
  type        = string
  default     = "github-actions-deploy-role"
}