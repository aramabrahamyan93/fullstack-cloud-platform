output "github_actions_role_arn" {
  value = module.iam_github_oidc.role_arn
}

output "github_oidc_provider_arn" {
  value = module.iam_github_oidc.oidc_provider_arn
}