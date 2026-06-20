# ECR repositories are enabled by default for normal image publishing.
# Account-specific tfvars may override this to false for paused environments.
enable_ecr_repositories = true

services = [
  "backend",
  "frontend",

  # Future services:
  # "worker",
  # "ai-service",
]