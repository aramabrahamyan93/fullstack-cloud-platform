output "ecr_repository_names" {
  description = "Created ECR repository names."
  value       = module.ecr.repository_names
}

output "ecr_repository_urls" {
  description = "Created ECR repository URLs."
  value       = module.ecr.repository_urls
}