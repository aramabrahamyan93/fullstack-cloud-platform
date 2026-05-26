output "vpc_id" {
  value = module.vpc.vpc_id
}

output "public_subnet_ids" {
  value = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}

output "eks_cluster_name" {
  value = var.enable_eks ? module.eks[0].cluster_name : null
}

output "eks_cluster_endpoint" {
  value = var.enable_eks ? module.eks[0].cluster_endpoint : null
}

output "eks_node_group_name" {
  value = var.enable_eks ? module.eks[0].node_group_name : null
}

output "rds_endpoint" {
  description = "RDS endpoint."
  value       = var.enable_rds ? module.rds[0].db_endpoint : null
}

output "rds_secret_arn" {
  description = "Secrets Manager ARN for RDS credentials."
  value       = var.enable_rds ? module.rds[0].db_secret_arn : null
}