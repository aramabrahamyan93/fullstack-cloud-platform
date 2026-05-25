aws_region   = "eu-central-1"
project_name = "fullstack-cloud-platform"

github_owner = "aramabrahamyan93"
github_repo  = "fullstack-cloud-platform"

services = [
  "backend",
  "frontend",

  # Add future services here when needed:
  # "worker",
  # "ai-service",
  # "notification-service",
]

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