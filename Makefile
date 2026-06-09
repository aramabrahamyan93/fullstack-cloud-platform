ifneq (,$(wildcard project.env))
	include project.env
	export
endif

.DEFAULT_GOAL := help

PROJECT_NAME ?= platform
PROJECT_DOMAIN ?= $(PROJECT_NAME).local
APP_NAME ?= $(PROJECT_NAME)-api
RELEASE_PREFIX ?= fullstack
ENV ?= local

COMPOSE ?= bash scripts/compose.sh

AWS_ACCOUNT_ID ?=
AWS_REGION ?= eu-central-1

KIND_CLUSTER ?= $(PROJECT_NAME)
K8S_NAMESPACE ?= $(RELEASE_PREFIX)-$(ENV)

HELM_RELEASE ?= $(RELEASE_PREFIX)-$(ENV)
HELM_CHART ?= helm/platform
HELM_VALUES ?= $(HELM_CHART)/values-$(ENV).yaml

BACKEND_URL ?= http://localhost:8000
FRONTEND_URL ?= http://localhost:3000

HELM_SET_ARGS = \
	--set namespace=$(K8S_NAMESPACE) \
	--set global.projectName=$(PROJECT_NAME) \
	--set global.domain=$(PROJECT_DOMAIN) \
	--set global.awsAccountId=$(AWS_ACCOUNT_ID) \
	--set global.awsRegion=$(AWS_REGION)

# ----------------------------
# Help
# ----------------------------

.PHONY: help
help:
	@echo ""
	@echo "$(PROJECT_NAME)"
	@echo ""
	@echo "Environment:"
	@echo "  PROJECT_NAME=$(PROJECT_NAME)"
	@echo "  RELEASE_PREFIX=$(RELEASE_PREFIX)"
	@echo "  ENV=$(ENV)"
	@echo "  K8S_NAMESPACE=$(K8S_NAMESPACE)"
	@echo "  KIND_CLUSTER=$(KIND_CLUSTER)"
	@echo "  HELM_RELEASE=$(HELM_RELEASE)"
	@echo ""
	@echo "Local Docker Compose:"
	@echo "  make local-up              Start backend, frontend, postgres in background"
	@echo "  make local-up-attached     Start services attached"
	@echo "  make local-build           Build local Docker images"
	@echo "  make local-test            Run backend tests"
	@echo "  make local-smoke-test      Check backend/frontend locally"
	@echo "  make local-logs            Follow compose logs"
	@echo "  make local-down            Stop compose services"
	@echo "  make local-clean           Stop compose services and remove volumes"
	@echo ""
	@echo "Local Kubernetes / kind:"
	@echo "  make local-k8s-up          Create local kind cluster"
	@echo "  make local-k8s-build       Build backend/frontend images"
	@echo "  make local-k8s-load        Load images into kind"
	@echo "  make local-k8s-deploy      Build, load, and Helm deploy to kind"
	@echo "  make local-k8s-wait        Wait for backend/frontend rollouts"
	@echo "  make local-k8s-smoke-test  Run in-cluster smoke tests"
	@echo "  make local-k8s-status      Show local Kubernetes resources"
	@echo "  make local-k8s-down        Delete local kind cluster"
	@echo ""
	@echo "  make validate-services    Validate services.json registry"
	@echo "  make local-preview         Build and start production-like local preview"
	@echo ""
	@echo "Helm:"
	@echo "  make helm-lint             Lint Helm chart"
	@echo "  make helm-render           Render Helm chart"
	@echo "  make helm-deploy           Deploy Helm release"
	@echo "  make helm-status           Show Helm/Kubernetes status"
	@echo "  make helm-uninstall        Uninstall Helm release"
	@echo ""
	@echo "Cloud:"
	@echo "  make cloud-deploy ACCOUNT=dev-859981975099 AWS_PROFILE=aram-dev"
	@echo "  make cloud-teardown ACCOUNT=dev-859981975099 AWS_PROFILE=aram-dev"
	@echo ""
	@echo "Terraform:"
	@echo "  make tf-init STACK=platform"
	@echo "  make tf-plan STACK=platform"
	@echo "  make tf-apply STACK=platform"
	@echo "  make tf-destroy STACK=platform"
	@echo ""

.PHONY: up
up:
	$(COMPOSE) up

.PHONY: up-d
up-d:
	$(COMPOSE) up -d

.PHONY: down
down:
	$(COMPOSE) down

.PHONY: logs
logs:
	$(COMPOSE) logs -f

.PHONY: build
build:
	$(COMPOSE) build

.PHONY: test
test: backend-test

.PHONY: backend-test
backend-test:
	$(COMPOSE) run --rm backend pytest

.PHONY: frontend-validate
frontend-validate:
	$(COMPOSE) build frontend

.PHONY: clean
clean:
	$(COMPOSE) down -v

# ----------------------------
# Local Docker Compose aliases
# ----------------------------

.PHONY: local-up
local-up: up-d

.PHONY: local-up-attached
local-up-attached: up

.PHONY: local-build
local-build: build

.PHONY: local-test
local-test: test

.PHONY: local-logs
local-logs: logs

.PHONY: local-down
local-down: down

.PHONY: local-clean
local-clean: clean

.PHONY: local-smoke-test
local-smoke-test:
	BACKEND_URL="$(BACKEND_URL)" \
	FRONTEND_URL="$(FRONTEND_URL)" \
	CHECK_FRONTEND="$(CHECK_FRONTEND)" \
	bash scripts/local-smoke-test.sh

.PHONY: local-preview
local-preview:
	$(MAKE) local-down || true
	$(MAKE) local-build
	$(MAKE) local-up
	$(MAKE) local-smoke-test
	@echo ""
	@echo "Local preview is running:"
	@echo "  Frontend: $(FRONTEND_URL)"
	@echo "  Backend:  $(BACKEND_URL)"
	@echo ""
	@echo "Use 'make local-down' to stop it."

.PHONY: local-validate
local-validate:
	$(MAKE) local-down || true
	$(MAKE) local-clean || true
	$(MAKE) local-build
	$(MAKE) frontend-validate
	$(MAKE) local-up
	$(MAKE) local-smoke-test
	$(MAKE) local-test
	$(MAKE) local-down

# ----------------------------
# kind / Kubernetes local helpers
# ----------------------------

.PHONY: k8s-create
k8s-create:
	kind create cluster --name $(KIND_CLUSTER) --config k8s/kind-config.yaml

.PHONY: k8s-delete
k8s-delete:
	kind delete cluster --name $(KIND_CLUSTER)

.PHONY: k8s-build
k8s-build:
	$(COMPOSE) build backend frontend

.PHONY: k8s-load
k8s-load:
	kind load docker-image $(PROJECT_NAME)-backend:latest --name $(KIND_CLUSTER)
	kind load docker-image $(PROJECT_NAME)-frontend:latest --name $(KIND_CLUSTER)

.PHONY: k8s-status
k8s-status:
	kubectl get pods,svc,ingress,pvc -n $(K8S_NAMESPACE)

.PHONY: k8s-logs-backend
k8s-logs-backend:
	kubectl logs -f deployment/backend -n $(K8S_NAMESPACE)

.PHONY: k8s-logs-frontend
k8s-logs-frontend:
	kubectl logs -f deployment/frontend -n $(K8S_NAMESPACE)

.PHONY: k8s-restart-backend
k8s-restart-backend:
	kubectl rollout restart deployment/backend -n $(K8S_NAMESPACE)

.PHONY: k8s-restart-frontend
k8s-restart-frontend:
	kubectl rollout restart deployment/frontend -n $(K8S_NAMESPACE)


# ----------------------------
# Local Kubernetes / kind aliases
# ----------------------------

.PHONY: local-k8s-up
local-k8s-up: k8s-create

.PHONY: local-k8s-build
local-k8s-build: k8s-build

.PHONY: local-k8s-load
local-k8s-load: k8s-load

.PHONY: local-k8s-deploy
local-k8s-deploy:
	$(MAKE) k8s-build PROJECT_NAME=$(PROJECT_NAME)
	$(MAKE) k8s-load PROJECT_NAME=$(PROJECT_NAME) KIND_CLUSTER=$(KIND_CLUSTER)
	$(MAKE) helm-deploy ENV=local PROJECT_NAME=$(PROJECT_NAME) PROJECT_DOMAIN=$(PROJECT_DOMAIN) AWS_ACCOUNT_ID=$(AWS_ACCOUNT_ID) AWS_REGION=$(AWS_REGION)
	kubectl rollout restart deployment/backend -n $(K8S_NAMESPACE)
	kubectl rollout restart deployment/frontend -n $(K8S_NAMESPACE)

.PHONY: local-k8s-status
local-k8s-status:
	$(MAKE) k8s-status ENV=local

.PHONY: local-k8s-wait
local-k8s-wait:
	kubectl rollout status deployment/backend -n $(K8S_NAMESPACE) --timeout=120s
	kubectl rollout status deployment/frontend -n $(K8S_NAMESPACE) --timeout=120s

.PHONY: local-k8s-smoke-test
local-k8s-smoke-test:
	K8S_NAMESPACE="$(K8S_NAMESPACE)" \
	bash scripts/k8s-smoke-test.sh

.PHONY: local-k8s-down
local-k8s-down: k8s-delete

.PHONY: local-k8s-validate
local-k8s-validate:
	$(MAKE) local-k8s-down || true
	$(MAKE) local-k8s-up
	$(MAKE) local-k8s-deploy
	$(MAKE) local-k8s-wait
	$(MAKE) local-k8s-smoke-test
	$(MAKE) local-k8s-status



.PHONY: validate-services
validate-services:
	python scripts/validate-services.py

.PHONY: validate-local-all
validate-local-all:
	$(MAKE) validate-services
	$(MAKE) local-validate
	$(MAKE) local-k8s-validate

# ----------------------------
# Helm
# ----------------------------

.PHONY: helm-lint
helm-lint:
	helm lint $(HELM_CHART)

.PHONY: helm-render
helm-render:
	helm template $(HELM_RELEASE) $(HELM_CHART) \
		-f $(HELM_VALUES) \
		$(HELM_SET_ARGS)

.PHONY: helm-deploy
helm-deploy:
	@echo "Helm deploy ENV=$(ENV)"
	@echo "PROJECT_NAME=$(PROJECT_NAME)"
	@echo "AWS_ACCOUNT_ID=$(AWS_ACCOUNT_ID)"
	@echo "AWS_REGION=$(AWS_REGION)"
	@echo "IMAGE_TAG=$(IMAGE_TAG)"
	helm upgrade --install "$(HELM_RELEASE)" "$(HELM_CHART)" \
		--namespace "$(K8S_NAMESPACE)" \
		--create-namespace \
		-f "$(HELM_VALUES)" \
		$(HELM_SET_ARGS) \
		$(if $(IMAGE_TAG),--set backend.image.tag="$(IMAGE_TAG)" --set frontend.image.tag="$(IMAGE_TAG)",)

.PHONY: docker-build-push
docker-build-push:
	ACCOUNT="$(ACCOUNT)" \
	AWS_PROFILE="$(AWS_PROFILE)" \
	AWS_REGION="$(AWS_REGION)" \
	PROJECT_NAME="$(PROJECT_NAME)" \
	IMAGE_TAG="$(IMAGE_TAG)" \
	bash scripts/docker-build-push.sh

.PHONY: helm-status
helm-status:
	helm list -A
	kubectl get pods,svc,ingress,pvc -n $(K8S_NAMESPACE)

.PHONY: helm-uninstall
helm-uninstall:
	helm uninstall $(HELM_RELEASE) -n $(K8S_NAMESPACE)

.PHONY: k8s-helm-redeploy
k8s-helm-redeploy:
	$(MAKE) k8s-build PROJECT_NAME=$(PROJECT_NAME)
	$(MAKE) k8s-load PROJECT_NAME=$(PROJECT_NAME) KIND_CLUSTER=$(KIND_CLUSTER)
	$(MAKE) helm-deploy ENV=$(ENV) PROJECT_NAME=$(PROJECT_NAME) PROJECT_DOMAIN=$(PROJECT_DOMAIN) AWS_ACCOUNT_ID=$(AWS_ACCOUNT_ID) AWS_REGION=$(AWS_REGION)
	kubectl rollout restart deployment/backend -n $(K8S_NAMESPACE)
	kubectl rollout restart deployment/frontend -n $(K8S_NAMESPACE)

# ----------------------------
# Terraform
# ----------------------------

STACK ?= ecr
ACCOUNT ?= dev-859981975099
AWS_PROFILE ?= aram-dev
ACCOUNT_ID ?=
LOCK_TABLE ?= terraform-locks
TF_LOCK ?= true

.PHONY: tf-init
tf-init:
	ACTION=init STACK=$(STACK) ACCOUNT=$(ACCOUNT) AWS_PROFILE=$(AWS_PROFILE) PROJECT_NAME=$(PROJECT_NAME) AWS_REGION=$(AWS_REGION) ACCOUNT_ID=$(ACCOUNT_ID) LOCK_TABLE=$(LOCK_TABLE) TF_LOCK=$(TF_LOCK) bash scripts/terraform.sh

.PHONY: tf-plan
tf-plan:
	ACTION=plan STACK=$(STACK) ACCOUNT=$(ACCOUNT) AWS_PROFILE=$(AWS_PROFILE) PROJECT_NAME=$(PROJECT_NAME) AWS_REGION=$(AWS_REGION) ACCOUNT_ID=$(ACCOUNT_ID) LOCK_TABLE=$(LOCK_TABLE) TF_LOCK=$(TF_LOCK) bash scripts/terraform.sh

.PHONY: tf-apply
tf-apply:
	ACTION=apply STACK=$(STACK) ACCOUNT=$(ACCOUNT) AWS_PROFILE=$(AWS_PROFILE) PROJECT_NAME=$(PROJECT_NAME) AWS_REGION=$(AWS_REGION) ACCOUNT_ID=$(ACCOUNT_ID) LOCK_TABLE=$(LOCK_TABLE) TF_LOCK=$(TF_LOCK) bash scripts/terraform.sh

.PHONY: tf-destroy
tf-destroy:
	ACTION=destroy STACK=$(STACK) ACCOUNT=$(ACCOUNT) AWS_PROFILE=$(AWS_PROFILE) PROJECT_NAME=$(PROJECT_NAME) AWS_REGION=$(AWS_REGION) ACCOUNT_ID=$(ACCOUNT_ID) LOCK_TABLE=$(LOCK_TABLE) TF_LOCK=$(TF_LOCK) bash scripts/terraform.sh

.PHONY: tf-validate
tf-validate:
	ACTION=validate STACK=$(STACK) ACCOUNT=$(ACCOUNT) AWS_PROFILE=$(AWS_PROFILE) PROJECT_NAME=$(PROJECT_NAME) AWS_REGION=$(AWS_REGION) ACCOUNT_ID=$(ACCOUNT_ID) LOCK_TABLE=$(LOCK_TABLE) TF_LOCK=$(TF_LOCK) bash scripts/terraform.sh

# ----------------------------
# Cloud EKS/RDS workflow
# ----------------------------

.PHONY: cloud-deploy
cloud-deploy:
	ACCOUNT="$(ACCOUNT)" \
	AWS_PROFILE="$(AWS_PROFILE)" \
	AWS_REGION="$(AWS_REGION)" \
	PROJECT_NAME="$(PROJECT_NAME)" \
	RELEASE_PREFIX="$(RELEASE_PREFIX)"
	IMAGE_TAG="$(IMAGE_TAG)" \
	bash scripts/cloud-deploy.sh

.PHONY: cloud-teardown
cloud-teardown:
	ACCOUNT="$(ACCOUNT)" \
	AWS_PROFILE="$(AWS_PROFILE)" \
	AWS_REGION="$(AWS_REGION)" \
	PROJECT_NAME="$(PROJECT_NAME)" \
	RELEASE_PREFIX="$(RELEASE_PREFIX)" \
	bash scripts/cloud-teardown.sh

# ----------------------------
# Terraform remote state bootstrap
# ----------------------------

STATE_BUCKET ?=

.PHONY: tf-bootstrap-state
tf-bootstrap-state:
	ACCOUNT_ID=$(ACCOUNT_ID) \
	AWS_REGION=$(AWS_REGION) \
	AWS_PROFILE=$(AWS_PROFILE) \
	PROJECT_NAME=$(PROJECT_NAME) \
	STATE_BUCKET=$(STATE_BUCKET) \
	LOCK_TABLE=$(LOCK_TABLE) \
	bash scripts/bootstrap-terraform-state.sh

# ----------------------------
# Addons
# ----------------------------

.PHONY: deploy-addons
deploy-addons:
	ACCOUNT="$(ACCOUNT)" \
	AWS_PROFILE="$(AWS_PROFILE)" \
	AWS_REGION="$(AWS_REGION)" \
	PROJECT_NAME="$(PROJECT_NAME)" \
	bash scripts/deploy-addons.sh