output "github_actions_ecr_role_arn" {
  value = module.iam_github_oidc.ecr_role_arn
}

output "github_actions_terraform_role_arn" {
  value = module.iam_github_oidc.terraform_role_arn
}

output "github_oidc_provider_arn" {
  value = module.iam_github_oidc.oidc_provider_arn
}