# Architecture

This document describes the architecture direction for the Fullstack Cloud Platform project.

The platform is currently developed as a fullstack cloud-native application with a FastAPI backend, React frontend, PostgreSQL database, Docker-based local development, Kubernetes/Helm deployment support, and CI validation.

The long-term direction is to evolve the project into a SaaS-ready and enterprise-capable platform that can support users, organizations, teams, roles, permissions, integrations, and future service extraction where needed.

## Architecture decision summary

The platform will start as a **modular monolith** with feature-based modules.

The codebase must keep clear domain boundaries so selected modules can be extracted into separate services in the future if there is a real operational, scaling, or ownership reason.

Microservices are not introduced at this stage because the domain boundaries are still evolving and the operational overhead would slow down product development.

The current architecture direction is:

```text
Modular Monolith now
SaaS-ready boundaries now
Microservices later only when needed
```

## Why modular monolith now

A modular monolith gives the project a strong balance between simplicity and future extensibility.

At the current stage, the platform is still evolving quickly. Core domain concepts such as organizations, memberships, teams, roles, permissions, billing, integrations, and audit logging are not fully implemented yet.

Introducing microservices before these boundaries are clear would create unnecessary complexity.

A modular monolith allows us to:

```text
keep local development simple
keep CI/CD simpler
keep one backend deployment for now
move fast while the product is still changing
organize code by feature/domain
avoid random cross-feature coupling
prepare clean boundaries for future extraction
```

The goal is not to avoid microservices forever. The goal is to avoid premature microservices.

## Why not microservices now

Microservices are useful when there are clear reasons such as independent scaling, separate team ownership, strong isolation requirements, or different deployment lifecycles.

At this stage, introducing microservices would require solving many additional problems immediately:

```text
service-to-service authentication
API gateway
distributed tracing
centralized logging
message broker
retries and idempotency
database-per-service ownership
distributed transactions
contract versioning
local development orchestration
CI/CD per service
monitoring per service
security per service
deployment dependencies
```

This would add operational complexity before the platform actually needs it.

The biggest risk is choosing the wrong service boundaries too early.

For example, before the domain is mature, it is still unclear where the final boundaries should be between:

```text
auth
users
organizations
memberships
teams
roles
permissions
billing
notifications
integrations
AI assistant
audit logging
```

Wrong microservice boundaries are expensive to fix later.

Therefore, the platform should first mature as a modular monolith with clean feature boundaries.

## Current backend architecture

The backend is a FastAPI application organized around infrastructure modules and feature modules.

Current direction:

```text
services/backend/app
├── api
│   ├── exception_handlers.py
│   ├── health.py
│   ├── router.py
│   └── version.py
├── core
│   ├── config.py
│   ├── errors.py
│   ├── logging.py
│   └── security.py
├── db
│   ├── database.py
│   ├── dependencies.py
│   └── init_db.py
├── features
│   ├── auth
│   │   ├── router.py
│   │   ├── schemas.py
│   │   └── service.py
│   ├── tasks
│   │   ├── constants.py
│   │   ├── models.py
│   │   ├── repository.py
│   │   ├── router.py
│   │   ├── schemas.py
│   │   └── service.py
│   └── users
│       ├── models.py
│       └── repository.py
└── main.py
```

This structure replaces the earlier mostly layer-based backend structure:

```text
api/
models/
repositories/
schemas/
services/
```

The old structure was good for an MVP, but as the platform grows it becomes harder to keep each feature self-contained.

In the new direction, each domain feature owns its own router, schemas, service, repository, model, and constants when those files are needed.

## Backend module responsibilities

### API module

The `api` package contains application-level API wiring.

It should contain:

```text
router aggregation
health endpoint
version endpoint
exception handler registration
```

It should not contain feature-specific business logic.

Feature routers should live inside their feature modules.

Example:

```text
app/features/tasks/router.py
app/features/auth/router.py
```

The central API router should include feature routers:

```text
app/api/router.py
```

This keeps `main.py` clean and avoids changing the application bootstrap every time a feature router is added.

### Core module

The `core` package contains cross-cutting application infrastructure.

Examples:

```text
configuration
logging
security helpers
application errors
```

The `core` module should not contain feature-specific logic.

### Database module

The `db` package contains database infrastructure.

Examples:

```text
SQLAlchemy engine/session setup
database dependencies
database initialization
```

Alembic migrations are intentionally postponed for now. The current MVP/local workflow still uses SQLAlchemy `create_all()`.

When the platform matures, migrations should be introduced as a separate controlled step.

### Feature modules

Feature modules contain domain/application logic.

A feature may contain:

```text
router.py
service.py
repository.py
schemas.py
models.py
constants.py
permissions.py
events.py
```

Only create files that are actually useful.

Do not create empty folders or artificial layers just to make the project look more complex.

A feature should be self-contained as much as possible.

Example:

```text
features/tasks/
  router.py
  service.py
  repository.py
  schemas.py
  models.py
  constants.py
```

## Backend layer responsibilities inside a feature

### Router

The router is responsible for HTTP-level concerns:

```text
path
method
request body
query parameters
path parameters
response model
status code
FastAPI dependencies
```

The router should not contain business logic.

### Service

The service is responsible for business/application rules:

```text
workflow coordination
ownership checks
permission checks
calling repositories
raising domain/application errors
logging important operations
```

The service should not know frontend details.

### Repository

The repository is responsible for database access:

```text
queries
filters
counts
insert/update/delete
commit/refresh helpers
```

The repository should not know HTTP, JWT, or response formatting.

### Schemas

Schemas define API request/response/query contracts.

Examples:

```text
request body models
response models
query models
validation rules
```

### Models

Models define database tables and relationships.

Examples:

```text
columns
constraints
indexes
foreign keys
relationships
```

### Constants

Constants centralize domain values and repeated validation values.

Examples:

```text
task statuses
default pagination limit
maximum pagination limit
title length
search length
```

Environment-specific values should not go into constants. They belong in configuration.

## Current frontend architecture

The frontend is currently a React + TypeScript application.

The earlier structure is mostly layer-based:

```text
apps/frontend/src
├── api
├── auth
├── components
├── tasks
├── types
├── App.tsx
├── config.ts
├── main.tsx
└── styles.css
```

This is acceptable for the current MVP, but it will become harder to manage as the product grows.

The frontend should gradually move toward a feature-based structure.

Target direction:

```text
apps/frontend/src
├── app
│   ├── App.tsx
│   ├── config.ts
│   ├── providers.tsx
│   └── routes.tsx
├── shared
│   ├── api
│   ├── components
│   ├── hooks
│   ├── types
│   └── utils
├── features
│   ├── auth
│   ├── system
│   ├── tasks
│   ├── organizations
│   ├── memberships
│   ├── admin
│   ├── billing
│   ├── notifications
│   └── ai-assistant
├── pages
└── main.tsx
```

Do not create all of these folders immediately. Create them when the related functionality starts to exist.

## Frontend module responsibilities

### App module

The `app` module should contain application composition.

Examples:

```text
root App component
providers
routing
app-level config
```

### Shared module

The `shared` module should contain reusable generic code.

Good shared examples:

```text
API client
API error handling
generic buttons/cards/messages
loading state
empty state
pagination controls
common hooks
common types
```

Bad shared examples:

```text
task-specific UI
auth-specific workflow
organization-specific business rules
one-off helpers used by only one feature
```

If code belongs to one feature, keep it inside that feature.

### Feature modules

Feature modules own domain-specific frontend code.

A feature may contain:

```text
api.ts
types.ts
constants.ts
hooks/
components/
utils/
```

Only create folders that are actually useful.

Example:

```text
features/tasks/
  api.ts
  types.ts
  constants.ts
  hooks/useTasks.ts
  components/TaskForm.tsx
  components/TaskList.tsx
```

### Pages

Pages should be introduced when routing becomes necessary.

Examples:

```text
LoginPage
DashboardPage
OrganizationPage
AdminPage
BillingPage
```

At the current stage, a full routing system is not required unless the UI starts to need multiple pages.

## SaaS direction

The platform should be designed to support SaaS concepts.

The long-term domain model should include:

```text
User
Organization
Membership
Team
Role
Permission
AuditLog
BillingAccount
Integration
```

The current implementation has users and user-owned tasks.

That is enough for the current MVP, but future SaaS work should move toward organization-aware data.

## Organizations and memberships

In a SaaS platform, users are not enough.

A user may belong to multiple organizations.

Example:

```text
User: Aram
Organization: DataNect LLC
Membership: Aram belongs to DataNect LLC as owner
```

A user can have different roles in different organizations.

Example:

```text
Aram -> Organization A -> owner
Aram -> Organization B -> viewer
```

Because of this, permissions should not be modeled only as a global `user.role`.

A better long-term model is:

```text
User
Organization
Membership(role)
```

Roles and permissions should become organization-aware.

## Workspace public IDs and lifecycle

Workspace public IDs are used to avoid exposing numeric database IDs in browser URLs and frontend API calls.

Current pattern:

```text
public_id:
  used by frontend routes and API paths
  example: ws_8fK2xQm91aP

id:
  internal numeric database identifier
  used by backend joins and service logic
```

Workspace lifecycle is status-based:

```text
active -> archived -> active
active -> archived -> deleted
```

### Workspace soft delete policy

Workspace delete is implemented as soft delete, not hard delete.

Policy:

```text
active -> archived -> deleted
```

Rules:

- only archived workspaces can be soft-deleted
- only owners can soft-delete
- deleted workspaces are excluded from normal member-facing list/get routes
- deleted workspaces cannot be restored through the current normal user-facing restore flow
- hard delete, retention windows, and admin recovery remain future policy work


Current lifecycle rules:

- only owners can archive or restore a workspace
- archived workspaces remain readable by members
- archived workspace writes are blocked with `workspace_archived`
- deleted workspaces are hidden from normal member-facing workspace routes
- soft delete records `workspace_deleted`
- active workspace delete attempts return `workspace_delete_requires_archive`
- restore returns the workspace to active mode
- archive and restore write audit events
- frontend read-only controls are UX helpers; backend policy is the source of truth

This keeps lifecycle management simple while preserving clear boundaries for future hard-delete, retention, and admin recovery policies.

## Multi-tenancy strategy

The recommended initial multi-tenancy strategy is:

```text
single database
shared tables
organization_id on tenant-owned tables
```

Example:

```text
tasks
  id
  organization_id
  owner_id
  title
  status
```

This approach is simple, cost-effective, and appropriate for the early SaaS stage.

Benefits:

```text
simple local development
simple deployment
one migration flow
lower cost
easier debugging
works well for MVP and early SaaS
```

Risks:

```text
every tenant-owned query must include organization scope
bugs can cause data leakage if tenant filtering is missed
enterprise customers may later require stronger isolation
```

To reduce risk, tenant-owned repositories and services must consistently enforce organization scoping once organizations are introduced.

Future options may include schema-per-tenant or database-per-tenant for enterprise customers, but those should not be introduced before there is a real need.

## Permissions direction

Permissions should be designed around organization membership.

Avoid this long-term model:

```text
users.role = admin
```

Prefer this long-term model:

```text
memberships.role = owner | admin | member | viewer
```

Later, permission checks can be added on top of membership roles.

Examples:

```text
task:create
task:update
task:delete
user:invite
billing:manage
organization:update
```

Role and permission work should come after the organization/membership foundation, because permissions in a SaaS platform depend on organization context.

The current workspace permission foundation already enforces owner/member behavior for invitations, member management, ownership transfer, workspace leave, workspace tasks, rename, archive, and restore. Future work can expand this into a richer role matrix without moving permission checks into the frontend.

## Task ownership direction

The current task model is user-owned.

Current concept:

```text
task.owner_id
```

This is acceptable for the current MVP.

For SaaS, task ownership evolves toward:

```text
task.organization_id
task.created_by_user_id
task.assigned_to_user_id
```

Workspace-scoped task APIs now enforce membership and lifecycle policy. Owners and members can manage tasks while a workspace is active. Archived workspaces allow task reads but block task create/update/delete.

Do not change the task ownership model during architecture-only refactors.

## Integration direction

Future integrations should be implemented as feature modules first.

Possible future modules:

```text
features/integrations
features/webhooks
features/notifications
features/ai_assistant
```

Integration features should be designed with:

```text
configuration
secrets management
retry handling
idempotency
logging
audit events
background processing
```

Do not introduce a message broker or event bus until there is a real need.

When background processing becomes necessary, it can be introduced as a controlled architectural step.

## Future microservice extraction

Microservices should be introduced only when there is a clear reason.

Valid reasons may include:

```text
a module needs independent scaling
a module has a separate deployment lifecycle
a module needs stronger isolation
a module has separate ownership
a module performs heavy background processing
a module has different infrastructure requirements
```

Possible future extraction candidates:

```text
notification service
billing service
AI assistant service
integration worker service
audit/event service
```

Before extracting a module, it should already have clear boundaries inside the modular monolith.

Extraction should not happen just because microservices sound more enterprise.

## Module boundary rules

To keep the modular monolith clean:

```text
feature modules should not import randomly from each other
shared code must be truly reusable
cross-feature workflows should go through services or future events
database access should stay inside repositories
routers should not call repositories directly
services should own business rules
core/db modules should not depend on feature modules except for controlled model registration
```

Some cross-feature imports are acceptable when they are stable domain dependencies.

Example:

```text
tasks may reference users as owners
memberships may reference users and organizations
```

But uncontrolled cross-feature imports should be avoided.

## Shared code rules

Shared code is allowed only when it is genuinely reusable.

Good shared backend examples:

```text
pagination helpers
base repository helper if duplication exists
permission dependency helpers
common error types
common logging helpers
```

Good shared frontend examples:

```text
API client
API error handling
Message component
LoadingState component
EmptyState component
PaginationControls component
common hooks
```

Do not move code into shared just because it might be useful someday.

## Configuration and hardcoding rules

Environment-specific values must come from configuration.

Examples:

```text
database URL
JWT secret
JWT expiration
CORS origins
log level
environment name
external service URLs
AWS region/account IDs
feature flags
```

Domain constants should be centralized inside the related feature or shared module.

Examples:

```text
task statuses
default pagination limit
maximum pagination limit
allowed page sizes
maximum title length
```

Avoid repeating the same hardcoded values across many files.

## Branching and change strategy

Use one branch per integration or refactor.

Examples:

```text
refactor/architecture-foundation
feature/organizations-memberships
feature/roles-permissions
feature/admin-users
feature/audit-logging
feature/ai-assistant
```

Architecture refactor branches should not introduce product behavior.

Allowed in architecture refactor branches:

```text
move files
rename imports
extract shared helpers
centralize constants
improve folder structure
update documentation
```

Not allowed in the same architecture refactor branch:

```text
new endpoints
new database columns
new UI features
new permissions
new cloud resources
new integrations
```

New behavior should be implemented in separate feature branches.

## Validation strategy

After backend changes:

```bash
make test
```

After frontend changes:

```bash
make frontend-validate
```

For full local validation when needed:

```bash
make local-smoke-test
```

For Kubernetes validation when needed:

```bash
make local-k8s-validate
```

Cloud resources should not be created during architecture-only work.

## Cloud cost safety

Architecture and local validation work should not create AWS resources.

Cloud resources such as EKS, RDS, NAT Gateway, Load Balancers, ECR, and related AWS services may generate cost.

Cost-generating resources should stay disabled by default unless explicitly needed for testing.

Temporary cloud resources should be destroyed or disabled after validation.


### Terraform account variable structure

Terraform account configuration is stack-aware. Instead of one large account file, each account has a folder with shared and stack-specific values:

```text
infra/accounts/<account>/common.tfvars
infra/accounts/<account>/bootstrap.tfvars
infra/accounts/<account>/ecr.tfvars
infra/accounts/<account>/platform.tfvars
```

This keeps stack inputs explicit and avoids Terraform undeclared-variable warnings caused by passing unrelated values to a stack. It also makes cloud cost flags easier to review per stack.

The dev account currently disables ECR repositories through its ECR stack config. Automatic ECR image publishing remains disabled until ECR repositories are intentionally re-enabled and recreated.

## Next phase architecture planning

The next architecture work is split into two independent decision tracks.

### Local GitOps and monitoring

The project already has ArgoCD and monitoring-related files, but the local development value still needs to be reviewed before adding more automation.

Current principle:

```text
local monitoring first
local ArgoCD only if it adds clear value
cloud resources disabled unless intentionally enabled
```

Local monitoring should help validate:

- backend metrics exposure
- Helm `ServiceMonitor` rendering
- Prometheus scrape configuration
- Grafana/dashboard usefulness
- cleanup and repeatability in kind

Local ArgoCD should remain optional because it can add complexity to the local loop. It should not become required for normal `make local-validate` or fast development checks.

### Workspace-first product model

The current implementation uses organization naming in backend code and database tables while presenting workspaces in the product UI.

The preferred direction is workspace-first at the product level:

```text
customer/company deployment
└── one or more workspaces
    ├── members
    ├── invitations
    ├── tasks
    ├── dashboard
    ├── activity
    └── settings
```

The organization-level concept should be preserved as a possible future extension, but it should not force the current MVP into a more complex multi-organization model.

Recommended near-term architecture decision:

- keep database tables named `organizations` for now
- keep `/organizations` API routes for now
- keep `/workspaces` browser routes
- keep public workspace IDs as the external route/API identifier
- clean user-facing language toward workspace
- postpone DB/table renames until Alembic migrations exist
- avoid one large rename that touches database, backend, frontend, tests, and docs at the same time

This keeps the current validated behavior stable while allowing the product model to become clearer.


## Current recommended roadmap

Recommended architecture/product sequence:

```text
1. Finish backend feature-based cleanup
2. Finish frontend feature-based cleanup
3. Keep constants/config centralized
4. Document architecture decisions
5. Revisit the organization/workspace domain model and decide whether the product model should become workspace-first while preserving organization-level extension options
6. Keep public workspace IDs as the browser/API route contract
7. Keep archive/restore/soft-delete lifecycle backend-enforced
8. Design hard-delete, retention, and admin recovery policy separately
9. Add richer roles and permissions only after the current owner/member model is stable
10. Add integrations and notifications
11. Add background processing/event patterns when needed
12. Extract microservices only when there is a real need
```

This sequence keeps the project practical now and prepares it for SaaS/enterprise growth later.

## Final decision

The final architecture decision is:

```text
The Fullstack Cloud Platform will evolve as a SaaS-ready modular monolith.

The project will keep feature-based modules and clear domain boundaries.

Organizations and memberships will become the foundation for multi-tenancy and permissions.

Microservices will not be introduced now.

Selected modules may be extracted into microservices later if scaling, ownership, isolation, or operational needs justify it.
```
