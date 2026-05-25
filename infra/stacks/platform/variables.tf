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