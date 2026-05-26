output "rds_endpoint" {
  description = "RDS endpoint including host and port."
  value       = var.enable_rds ? module.rds[0].db_endpoint : null
}

output "rds_address" {
  description = "RDS host address without port."
  value       = var.enable_rds ? module.rds[0].db_address : null
}

output "rds_port" {
  description = "RDS PostgreSQL port."
  value       = var.enable_rds ? module.rds[0].db_port : null
}

output "rds_database_name" {
  description = "RDS database name."
  value       = var.enable_rds ? module.rds[0].db_name : null
}

output "rds_secret_arn" {
  description = "Secrets Manager ARN for RDS credentials."
  value       = var.enable_rds ? module.rds[0].db_secret_arn : null
}

output "rds_secret_name" {
  description = "Secrets Manager secret name for RDS credentials."
  value       = var.enable_rds ? module.rds[0].db_secret_name : null
}

output "rds_security_group_id" {
  description = "RDS security group ID."
  value       = var.enable_rds ? module.rds[0].db_security_group_id : null
}