variable "project_name" {
  type        = string
  description = "Project name used for resource naming."
}

variable "environment" {
  type        = string
  description = "Deployment environment."
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR block."
}

variable "availability_zones" {
  type        = list(string)
  description = "Availability zones."
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "Public subnet CIDR blocks."
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "Private subnet CIDR blocks."
}

variable "enable_nat_gateway" {
  description = "Whether to create NAT Gateway for private subnet internet access."
  type        = bool
  default     = false
}