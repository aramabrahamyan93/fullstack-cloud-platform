variable "aws_region" {
  description = "AWS region where resources will be created."
  type        = string
}

variable "project_name" {
  description = "Project name used as prefix for resources."
  type        = string
}

variable "services" {
  description = "Application services that need ECR repositories."
  type        = list(string)
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "account_id" {
  description = "Target AWS account ID."
  type        = string
}