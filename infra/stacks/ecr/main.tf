module "ecr" {
  source = "../../modules/ecr"

  project_name = var.project_name
  services     = var.services
  environment  = var.environment
  account_id   = var.account_id
}