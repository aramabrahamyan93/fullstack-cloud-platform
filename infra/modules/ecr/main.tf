resource "aws_ecr_repository" "service" {
  for_each = toset(var.services)

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