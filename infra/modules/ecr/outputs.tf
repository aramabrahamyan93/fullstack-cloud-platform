output "repository_names" {
  description = "ECR repository names by service."
  value = {
    for service, repo in aws_ecr_repository.service :
    service => repo.name
  }
}

output "repository_urls" {
  description = "ECR repository URLs by service."
  value = {
    for service, repo in aws_ecr_repository.service :
    service => repo.repository_url
  }
}