variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
}

variable "environment" {
  description = "Deployment environment."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where RDS will be created."
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for RDS subnet group."
  type        = list(string)
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

variable "instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "allocated_storage" {
  description = "Allocated storage in GB."
  type        = number
  default     = 20
}

variable "engine_version" {
  description = "PostgreSQL engine version."
  type        = string
  default     = "16.3"
}