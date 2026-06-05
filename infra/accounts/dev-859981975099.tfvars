environment = "dev"
account_id  = "859981975099"

enable_vpc = true
enable_eks = true
enable_rds = true

eks_node_desired_size = 3
eks_node_min_size     = 2
eks_node_max_size     = 3

secret_recovery_window_in_days = 0