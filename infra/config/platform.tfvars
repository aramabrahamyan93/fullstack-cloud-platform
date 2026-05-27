availability_zones = [
  "eu-central-1a",
  "eu-central-1b"
]

vpc_cidr = "10.0.0.0/16"

public_subnet_cidrs = [
  "10.0.1.0/24",
  "10.0.2.0/24"
]

private_subnet_cidrs = [
  "10.0.101.0/24",
  "10.0.102.0/24"
]

eks_cluster_version = "1.31"

eks_node_instance_types = [
  "t3.small"
]

eks_node_desired_size = 1
eks_node_min_size     = 1
eks_node_max_size     = 1

# Cost-control flags.
enable_nat_gateway = false
enable_eks         = false

enable_rds = false

db_name     = "app"
db_username = "app"

# RDS safety settings.
# Dev-friendly defaults: easy to destroy, but still keeps automated backups while running.
rds_deletion_protection   = false
rds_skip_final_snapshot   = true
rds_backup_retention_days = 7