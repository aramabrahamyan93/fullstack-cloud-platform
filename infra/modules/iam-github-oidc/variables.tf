variable "account_id" {
  description = "Target AWS account ID."
  type        = string
}

variable "aws_region" {
  description = "AWS region."
  type        = string
}

variable "project_name" {
  description = "Project name used as prefix for ECR repositories."
  type        = string
}

variable "services" {
  description = "Application services that require ECR access."
  type        = list(string)
}

variable "github_owner" {
  description = "GitHub repository owner or organization."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name."
  type        = string
}

variable "ecr_role_name" {
  description = "IAM role name used by GitHub Actions for ECR push."
  type        = string
  default     = "github-actions-ecr-role"
}

variable "terraform_role_name" {
  description = "IAM role name used by GitHub Actions for Terraform CI."
  type        = string
  default     = "github-actions-terraform-role"
}