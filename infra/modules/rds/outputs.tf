output "db_endpoint" {
  description = "RDS endpoint including host and port."
  value       = aws_db_instance.this.endpoint
}

output "db_address" {
  description = "RDS host address without port."
  value       = aws_db_instance.this.address
}

output "db_port" {
  description = "RDS PostgreSQL port."
  value       = aws_db_instance.this.port
}

output "db_name" {
  description = "Database name."
  value       = aws_db_instance.this.db_name
}

output "db_secret_arn" {
  description = "Secrets Manager secret ARN containing DB credentials."
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "db_secret_name" {
  description = "Secrets Manager secret name containing DB credentials."
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "db_security_group_id" {
  description = "RDS security group ID."
  value       = aws_security_group.rds.id
}