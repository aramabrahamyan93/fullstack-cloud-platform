# Next Phase Planning

This document captures the agreed planning direction after the infrastructure safety cleanup and before the next implementation branches.

The goal is to keep the project moving in small, reviewable phases while avoiding large risky rewrites.

## Current baseline

The current `develop` baseline includes:

- workspace lifecycle foundation, including public workspace IDs, dashboard, activity, archive, restore, and soft delete
- dev ECR repositories disabled for cost safety
- automatic ECR publishing disabled while dev ECR repositories are disabled
- Terraform account variables split by account and stack
- cloud deploy Makefile environment chain fixed so `IMAGE_TAG` is passed correctly
- infrastructure documentation updated for the current AWS safety state

All future implementation work should start from a dedicated branch instead of committing directly on `develop`.

## Branch workflow

Every change should follow this workflow:

```text
sync develop
create feature/fix/docs branch
make one focused change
write validation output to tmp/<phase>.txt
review output
commit on branch
push branch
merge only after review
```

Recommended branch prefixes:

```text
feature/...
fix/...
docs/...
chore/...
```

Use small branches. Avoid mixing roadmap documentation, monitoring implementation, and workspace domain refactors in one branch.

## Next recommended sequence

```text
Phase 1: Roadmap and planning docs
Phase 2: Local ArgoCD/monitoring audit
Phase 3: Minimal local monitoring stack
Phase 4: Optional local ArgoCD preview
Phase 5: Workspace-first domain decision and staged refactor plan
```

## Phase 1 — Roadmap and planning docs

Status: current branch.

Goal:

- document the next sequence of work
- define the local GitOps/monitoring review scope
- define the workspace-first domain decision scope
- keep the plan explicit before implementation starts

This phase should not change application behavior.

Expected outputs:

- updated roadmap
- updated architecture notes
- clear implementation branch list
- risk notes

Validation:

```bash
git status --short
git diff --stat
```

## Phase 2 — Local ArgoCD and monitoring audit

Recommended branch:

```text
feature/local-gitops-monitoring-audit
```

Goal:

Understand what is already available and what is missing before enabling anything locally.

Review areas:

- kind cluster status
- Helm local values
- `backend-servicemonitor.yaml`
- backend `/metrics` availability
- `addons/monitoring/values.yaml`
- `scripts/addons/monitoring.sh`
- `scripts/addons/argocd.sh`
- `scripts/deploy-addons.sh`
- whether local addon flags should exist separately from dev/staging cloud flags

Questions to answer:

- Does local monitoring need Grafana now, or is Prometheus enough for the first step?
- Does the backend expose `/metrics` in the current local runtime?
- Is ServiceMonitor rendered in local Helm values?
- Should local ArgoCD be part of normal local validation, or only an optional preview?
- Which parts are useful locally and which parts should remain cloud-only?

Expected outcome:

- no major implementation yet
- a clear local observability/GitOps implementation plan
- a decision on whether to start with monitoring or ArgoCD

Recommendation:

Start with monitoring before ArgoCD. Monitoring gives faster practical feedback and helps validate backend metrics, ServiceMonitor wiring, and dashboards. ArgoCD local preview can be added later if it provides enough value.

## Phase 3 — Minimal local monitoring stack

Recommended branch:

```text
feature/local-monitoring-stack
```

Goal:

Create an optional local monitoring flow for kind.

Expected capabilities:

- install monitoring stack into local kind
- expose or port-forward Prometheus/Grafana as needed
- validate backend metrics endpoint
- validate ServiceMonitor selection
- document local commands
- keep the feature optional and disabled by default

Potential implementation tasks:

1. Confirm or add backend metrics endpoint.
2. Confirm Helm renders ServiceMonitor only when monitoring is enabled.
3. Add local addon config if needed, separate from cloud `config/addons/dev.env`.
4. Add Make targets or scripts for local monitoring preview.
5. Add smoke/verification command that checks pods, services, and backend metrics scrape readiness.
6. Document usage and cleanup.

Safety:

Local monitoring must not affect cloud resources and must not enable AWS resources.

## Phase 4 — Optional local ArgoCD preview

Recommended branch:

```text
feature/local-argocd-preview
```

Goal:

Evaluate whether ArgoCD is useful locally for GitOps-style learning and validation.

Potential capabilities:

- install ArgoCD into local kind
- render an application pointing at the local Helm chart or current Git branch
- document login/port-forward steps
- keep the flow optional
- avoid making local ArgoCD part of normal quick validation unless it proves useful

Risks:

- local ArgoCD can add complexity without improving the development loop
- it can duplicate Helm validation that already works locally
- it may require Git/branch setup that slows down iteration

Recommendation:

Do not make local ArgoCD mandatory. Treat it as an optional preview and learning workflow.

## Phase 5 — Workspace-first domain decision

Recommended branch:

```text
docs/workspace-first-domain-plan
```

Goal:

Decide how to move from the current organization/workspace split toward a workspace-first product model without losing the future organization-level option.

Current state:

```text
Backend package: services/backend/app/features/organizations/
Backend route prefix: /organizations
Database tables: organizations, organization_members, organization_invitations, organization_audit_logs
Frontend product routes: /workspaces
Frontend feature folder: apps/frontend/src/features/organizations/
Product language: workspace
Internal/domain language: mixed organization/workspace
```

Preferred direction:

- product concept: workspace
- one deployed platform can represent one customer/company
- inside that platform, users can create one or more workspaces
- organization-level/multi-tenant enterprise concepts remain a future extension
- public workspace IDs remain the browser/API route identifier
- backend remains the source of truth for permissions

Recommended strategy:

Do not rename database tables now.

Reasons:

- Alembic migrations are postponed
- database/table renames create unnecessary risk
- current code and tests already cover many organization/workspace flows
- the public product model can become workspace-first without a destructive database rename

Suggested staged approach:

1. Document the product decision.
2. Clean user-facing wording to consistently say workspace.
3. Keep `/organizations` API routes for compatibility.
4. Consider adding `/workspaces` API aliases later if needed.
5. Rename frontend feature folder only if it can be done safely with strong validation.
6. Rename backend package/classes only after the workspace API contract is stable.
7. Revisit DB table/column renames only when Alembic migration workflow exists.

## Decision matrix

| Topic | Recommended decision | Reason |
|---|---|---|
| Product term | Workspace | Matches current UI and desired business model |
| Backend DB tables | Keep `organizations` for now | Avoid risky migration work before Alembic |
| API route | Keep `/organizations` for now | Existing tests/docs depend on it |
| Browser route | Keep `/workspaces` | Good product-facing route |
| Public ID | Keep `ws_...` | Already workspace-first and safer than numeric IDs |
| Future organization level | Preserve as extension option | Useful if later enterprise/multi-tenant model is needed |
| Immediate refactor | Small docs/UI/service naming steps | Avoid one large rename |

## Risk management

Avoid these changes in one large step:

- renaming database tables
- renaming all backend files/classes/functions
- changing API routes and frontend calls at the same time
- changing permission logic while renaming domain terms
- enabling cloud resources while testing local GitOps/monitoring

Use separate branches and validation after each phase.

## Recommended immediate next implementation branch

After this planning branch is committed, start with:

```text
feature/local-gitops-monitoring-audit
```

Reason:

It is lower risk than the workspace refactor and gives a clear operational improvement path. It also helps decide what local observability should look like before deeper domain refactoring continues.
