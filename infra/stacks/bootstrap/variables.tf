variable "environment" {
  description = "Environment name."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  type = string
}

variable "account_id" {
  type = string
}

variable "project_name" {
  type = string
}

variable "services" {
  type = list(string)
}

variable "github_owner" {
  type = string
}

variable "github_repo" {
  type = string
}