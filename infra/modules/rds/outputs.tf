output "db_endpoint" {
  description = "RDS endpoint."
  value       = aws_db_instance.this.endpoint
}

output "db_name" {
  description = "Database name."
  value       = aws_db_instance.this.db_name
}

output "db_secret_arn" {
  description = "Secrets Manager secret ARN containing DB credentials."
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "db_security_group_id" {
  description = "RDS security group ID."
  value       = aws_security_group.rds.id
}