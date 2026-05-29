variable "project_name" {
  description = "Project name used as prefix for ECR repositories."
  type        = string
}

variable "services" {
  description = "List of application services that need ECR repositories."
  type        = list(string)
}

variable "image_tag_mutability" {
  description = "ECR image tag mutability."
  type        = string
  default     = "MUTABLE"
}

variable "scan_on_push" {
  description = "Enable image scanning on push."
  type        = bool
  default     = true
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "account_id" {
  description = "Target AWS account ID."
  type        = string
}