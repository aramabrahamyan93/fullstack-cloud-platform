ifneq (,$(wildcard project.env))
	include project.env
	export
endif

COMPOSE=docker compose --env-file project.env

PROJECT_NAME ?= platform
PROJECT_DOMAIN ?= $(PROJECT_NAME).local
APP_NAME ?= $(PROJECT_NAME)-api
RELEASE_PREFIX ?= fullstack
ENV ?= local

AWS_ACCOUNT_ID ?=
AWS_REGION ?= eu-central-1

KIND_CLUSTER ?= $(PROJECT_NAME)
K8S_NAMESPACE ?= $(RELEASE_PREFIX)-$(ENV)

HELM_RELEASE ?= $(RELEASE_PREFIX)-$(ENV)
HELM_CHART ?= helm/platform
HELM_VALUES ?= $(HELM_CHART)/values-$(ENV).yaml

HELM_SET_ARGS= \
	--set global.projectName=$(PROJECT_NAME) \
	--set global.domain=$(PROJECT_DOMAIN) \
	--set global.awsAccountId=$(AWS_ACCOUNT_ID) \
	--set global.awsRegion=$(AWS_REGION)

# ----------------------------
# Docker Compose
# ----------------------------

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
test:
	$(COMPOSE) run --rm backend pytest

.PHONY: clean
clean:
	$(COMPOSE) down -v

# ----------------------------
# kind / Kubernetes local helpers
# ----------------------------

.PHONY: k8s-create
k8s-create:
	kind create cluster --config k8s/kind-config.yaml

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
	helm upgrade --install $(HELM_RELEASE) $(HELM_CHART) \
		-f $(HELM_VALUES) \
		$(HELM_SET_ARGS)

.PHONY: helm-status
helm-status:
	helm list -A
	kubectl get pods,svc,ingress,pvc -n $(K8S_NAMESPACE)

.PHONY: helm-uninstall
helm-uninstall:
	helm uninstall $(HELM_RELEASE)

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