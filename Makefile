COMPOSE=docker compose

K8S_NAMESPACE=fullstack-local
KIND_CLUSTER=fullstack-cloud-platform

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
# KIND / KUBERNETES
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
	kind load docker-image fullstack-cloud-platform-backend:latest --name $(KIND_CLUSTER)
	kind load docker-image fullstack-cloud-platform-frontend:latest --name $(KIND_CLUSTER)

.PHONY: k8s-deploy
k8s-deploy:
	kubectl apply -f k8s/base/namespace.yaml
	kubectl apply -f k8s/base/postgres.yaml
	kubectl apply -f k8s/base/backend.yaml
	kubectl apply -f k8s/base/frontend.yaml
	kubectl apply -f k8s/base/ingress.yaml

.PHONY: k8s-redeploy
k8s-redeploy:
	make k8s-build
	make k8s-load
	kubectl rollout restart deployment/backend -n $(K8S_NAMESPACE)
	kubectl rollout restart deployment/frontend -n $(K8S_NAMESPACE)

.PHONY: k8s-status
k8s-status:
	kubectl get pods,svc,ingress -n $(K8S_NAMESPACE)

.PHONY: k8s-logs-backend
k8s-logs-backend:
	kubectl logs -f deployment/backend -n $(K8S_NAMESPACE)

.PHONY: k8s-logs-frontend
k8s-logs-frontend:
	kubectl logs -f deployment/frontend -n $(K8S_NAMESPACE)

.PHONY: k8s-describe-backend
k8s-describe-backend:
	kubectl describe pod -n $(K8S_NAMESPACE) -l app=backend

.PHONY: k8s-describe-frontend
k8s-describe-frontend:
	kubectl describe pod -n $(K8S_NAMESPACE) -l app=frontend

.PHONY: k8s-restart-backend
k8s-restart-backend:
	kubectl rollout restart deployment/backend -n $(K8S_NAMESPACE)

.PHONY: k8s-restart-frontend
k8s-restart-frontend:
	kubectl rollout restart deployment/frontend -n $(K8S_NAMESPACE)

# ----------------------------
# HELM
# ----------------------------

.PHONY: helm-lint
helm-lint:
	helm lint helm/fullstack-cloud-platform

.PHONY: helm-render
helm-render:
	helm template fullstack-local helm/fullstack-cloud-platform \
		-f helm/fullstack-cloud-platform/values-local.yaml

.PHONY: helm-deploy
helm-deploy:
	helm upgrade --install fullstack-local helm/fullstack-cloud-platform \
		-f helm/fullstack-cloud-platform/values-local.yaml

.PHONY: helm-status
helm-status:
	helm list -A
	kubectl get pods,svc,ingress,pvc -n $(K8S_NAMESPACE)

.PHONY: helm-uninstall
helm-uninstall:
	helm uninstall fullstack-local

.PHONY: k8s-helm-redeploy
k8s-helm-redeploy:
	make k8s-build
	make k8s-load
	make helm-deploy
	kubectl rollout restart deployment/backend -n $(K8S_NAMESPACE)
	kubectl rollout restart deployment/frontend -n $(K8S_NAMESPACE)