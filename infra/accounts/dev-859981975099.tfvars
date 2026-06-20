environment = "dev"
account_id  = "859981975099"

enable_vpc = false
enable_eks = false
enable_rds = false

# ECR repositories are intentionally disabled for this dev account.
# This removes Terraform-managed backend/frontend ECR repositories when applied.
# Before apply, review `make tf-plan STACK=ecr` and confirm repository deletion is intended.
enable_ecr_repositories = false

eks_node_desired_size = 3
eks_node_min_size     = 2
eks_node_max_size     = 3

secret_recovery_window_in_days = 0