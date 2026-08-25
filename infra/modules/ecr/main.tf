resource "aws_ecr_repository" "service" {
  for_each = var.enable_repositories ? toset(var.services) : toset([])

  name                 = "${var.project_name}-${each.value}"
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  tags = {
    Project     = var.project_name
    Service     = each.value
    Environment = var.environment
    AccountId   = var.account_id
    ManagedBy   = "terraform"
  }
}