output "ecr_role_name" {
  value = aws_iam_role.github_actions_ecr.name
}

output "ecr_role_arn" {
  value = aws_iam_role.github_actions_ecr.arn
}

output "terraform_role_name" {
  value = aws_iam_role.github_actions_terraform.name
}

output "terraform_role_arn" {
  value = aws_iam_role.github_actions_terraform.arn
}

output "oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.github.arn
}

output "deploy_role_arn" {
  value = aws_iam_role.github_actions_deploy.arn
}