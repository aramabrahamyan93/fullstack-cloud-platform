# Operations

## Main command entry point

```bash
make help
```

## Full local validation

```bash
make validate-local-all
```

## Docker Compose operations

```bash
make local-up
make local-smoke-test
make local-test
make local-logs
make local-down
make local-clean
```

## Kubernetes operations

```bash
make local-k8s-up
make local-k8s-deploy
make local-k8s-wait
make local-k8s-smoke-test
make local-k8s-status
make local-k8s-down
```

## Local monitoring operations

Local monitoring is optional and runs only in the local kind cluster.

Install monitoring:

```bash
make local-monitoring-up
```

Deploy the app with backend `ServiceMonitor` enabled:

```bash
make local-k8s-deploy-monitoring
```

Check monitoring resources:

```bash
make local-monitoring-status
kubectl get servicemonitor backend -n fullstack-local
```

Validate application behavior and backend metrics:

```bash
make local-k8s-smoke-test
```

Optional Prometheus UI access:

```bash
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 19091:9090
```

Then open Prometheus locally on port `19091` and query:

```text
up{job="backend", namespace="fullstack-local", service="backend"}
```

Expected value:

```text
1
```

Optional Grafana access:

```bash
kubectl port-forward -n monitoring svc/monitoring-grafana 13000:80
```

Default local credentials from `addons/monitoring/values.yaml`:

```text
user: admin
password: admin
```

Cleanup:

```bash
make local-monitoring-down
```

## Helm operations

```bash
make helm-lint
make helm-render
make helm-deploy
make helm-status
make helm-uninstall
```

## Terraform operations

```bash
make tf-init STACK=platform
make tf-plan STACK=platform
make tf-apply STACK=platform
make tf-destroy STACK=platform
make tf-validate STACK=platform
```

Account variables are split by stack:

```text
infra/accounts/<account>/common.tfvars
infra/accounts/<account>/bootstrap.tfvars
infra/accounts/<account>/ecr.tfvars
infra/accounts/<account>/platform.tfvars
```

Always review `tf-plan` before `tf-apply` or `tf-destroy`.

For ECR specifically:

```bash
make tf-plan STACK=ecr ACCOUNT=dev-859981975099 AWS_PROFILE=aram-dev AWS_REGION=eu-central-1
```

The dev account currently has ECR repositories disabled in `infra/accounts/dev-859981975099/ecr.tfvars`.

## Cloud operations

```bash
make cloud-deploy ACCOUNT=dev-859981975099 AWS_PROFILE=aram-dev IMAGE_TAG=<image-tag>
make cloud-teardown ACCOUNT=dev-859981975099 AWS_PROFILE=aram-dev
```

## Health checks

Backend health endpoints:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/health/live
curl http://localhost:8000/health/ready
```

Frontend API proxy health endpoints:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/live
curl http://localhost:3000/api/health/ready
```

Tasks API through frontend proxy:

```bash
curl http://localhost:3000/api/tasks

curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Created from operations check","status":"open"}'
```

## Logs and debugging

Backend logs in local Kubernetes:

```bash
make k8s-logs-backend
```

Frontend logs in local Kubernetes:

```bash
make k8s-logs-frontend
```

Restart backend deployment:

```bash
make k8s-restart-backend
```

Restart frontend deployment:

```bash
make k8s-restart-frontend
```

## Cost control

Local workflows do not create AWS resources.

Before running cloud workflows, confirm:

- correct AWS account
- correct AWS profile
- intended environment
- expected resources
- teardown plan

After testing, run teardown if resources are not needed.

If ECR repositories are disabled for an account, do not run image publishing workflows until the repositories are re-enabled and created through Terraform.
