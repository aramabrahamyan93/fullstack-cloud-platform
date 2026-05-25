module "iam_github_oidc" {
  source = "../../modules/iam-github-oidc"

  account_id   = var.account_id
  aws_region   = var.aws_region
  project_name = var.project_name
  services     = var.services

  github_owner = var.github_owner
  github_repo  = var.github_repo
}