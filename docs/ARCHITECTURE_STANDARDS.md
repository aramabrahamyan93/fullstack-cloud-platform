# Architecture Standards

This document defines the architecture standards for the Fullstack Cloud Platform project.

The goal is to keep the platform clean, extensible, testable, and easy to evolve as new features and integrations are added.

## Core principles

### 1. Keep architecture natural, not artificial

Do not create folders, layers, abstractions, base classes, or helper files only to make the project look more complex.

A folder or abstraction should exist only when it has a clear purpose.

Good architecture should make the project easier to understand, not harder.

### 2. Prefer feature-based structure for application code

Application features should be grouped by domain when the project grows.

Examples:

```text
features/auth
features/users
features/tasks
features/roles
features/admin
features/notifications
features/ai-assistant
```

Each feature should contain the code that belongs to that feature.

For backend features, this may include:

```text
router.py
service.py
repository.py
schemas.py
models.py
constants.py
```

For frontend features, this may include:

```text
api.ts
types.ts
hooks/
components/
constants.ts
```

Only create these files or folders when they are useful.

### 3. Keep shared code truly shared

Shared code must be generic and reusable across multiple features.

Good shared examples:

```text
API client
error handling
pagination helpers
base repository helpers
generic UI components
configuration helpers
logging helpers
security helpers
```

Bad shared examples:

```text
Task-specific rules
Auth-specific UI
Feature-specific constants
One-off helper functions used by only one place
```

If code belongs to one feature, keep it inside that feature.

### 4. Keep files, classes, and functions focused

Code units should be reasonably small and easy to understand.

Soft guidelines:

```text
Function: usually 5-40 lines
File: ideally under 250 lines
Large file: review after 300-400 lines
Class: should have one clear responsibility
Folder: should not become a dumping ground
```

These are not strict mechanical limits. Readability matters more than line count.

Split code when it improves clarity. Do not split code when it creates unnecessary complexity.

### 5. Avoid hardcoding

Environment-specific values must come from configuration or environment variables.

Examples:

```text
Database URL
JWT secret
JWT expiration
CORS origins
log level
environment name
external service URLs
AWS region/account IDs
feature flags
```

Domain constants should be centralized.

Examples:

```text
Task statuses
Default pagination limit
Maximum pagination limit
Allowed page size options
Maximum title length
```

Avoid repeating the same values across many files.

### 6. Separate config from constants

Configuration values can change per environment.

Examples:

```text
DATABASE_URL
ENVIRONMENT
JWT_SECRET_KEY
ACCESS_TOKEN_EXPIRE_MINUTES
LOG_LEVEL
API_BASE_URL
```

Constants are stable domain or application rules.

Examples:

```text
TaskStatus = open | in_progress | done
DEFAULT_TASK_PAGE_SIZE = 5
MAX_TASK_LIMIT = 100
TASK_TITLE_MAX_LENGTH = 200
```

### 7. Keep backend responsibilities clear

Backend layers should have clear responsibilities.

#### Router layer

Responsible for:

```text
HTTP routes
request parameters
request body
response model
status codes
dependencies
```

Should not contain business logic.

#### Service layer

Responsible for:

```text
business rules
workflow coordination
ownership checks
permission checks
calling repositories
raising domain errors
```

Should not know frontend or UI details.

#### Repository layer

Responsible for:

```text
database queries
filters
counts
insert/update/delete
commit/refresh helpers
```

Should not know JWT, HTTP, or request/response formatting.

#### Schema layer

Responsible for:

```text
request contracts
response contracts
query contracts
validation rules
```

#### Model layer

Responsible for:

```text
database tables
columns
constraints
indexes
relationships
```

### 8. Keep frontend responsibilities clear

Frontend layers should have clear responsibilities.

#### API layer

Responsible for HTTP calls only.

Examples:

```text
login()
getCurrentUser()
getPaginatedTasks()
createTask()
```

Should not contain React state.

#### Hook layer

Responsible for state and UI workflow logic.

Examples:

```text
useAuth
useTasks
useRoles
useNotifications
```

May contain:

```text
loading state
mutation state
pagination state
error handling
feature workflow
```

#### Component layer

Responsible for rendering UI and handling local UI interactions.

Components should not call raw `fetch` directly.

#### Shared components

Shared components must be generic.

Examples:

```text
Message
LoadingState
EmptyState
PaginationControls
```

#### Feature components

Feature components belong to one domain.

Examples:

```text
AuthPanel
TaskForm
TaskDashboard
TaskList
TaskItem
```

### 9. Avoid overengineering

Do not introduce abstractions before they are useful.

Avoid unnecessary patterns such as:

```text
factories without need
managers without need
generic base services without repeated behavior
large inheritance trees
empty folders
one-line wrapper files
```

Prefer simple, readable code first.

Introduce abstractions only when they remove real duplication or make future changes safer.

### 10. Keep behavior unchanged during architecture refactors

Architecture refactor branches should not introduce new product behavior.

Allowed:

```text
move files
rename imports
extract shared helpers
centralize constants
improve folder structure
update documentation
```

Not allowed in the same refactor branch:

```text
new endpoints
new database columns
new UI features
new permissions
new cloud resources
new integrations
```

New features must be implemented in separate feature branches.

### 11. Keep validation green after each step

After each architecture refactor step, run the relevant validation.

Backend changes:

```bash
make test
```

Frontend changes:

```bash
make frontend-validate
```

Full local check when needed:

```bash
make local-smoke-test
```

Local Kubernetes check when needed:

```bash
make local-k8s-validate
```

### 12. Use one branch per integration or refactor

Use clear branch names.

Refactor branches:

```text
refactor/architecture-foundation
refactor/backend-feature-structure
refactor/frontend-feature-structure
```

Feature branches:

```text
feature/roles-permissions
feature/admin-users
feature/audit-logging
feature/ai-assistant
feature/notifications
```

Fix branches:

```text
fix/task-pagination-total
fix/auth-token-validation
```

Docs branches:

```text
docs/architecture-overview
docs/ci-workflows
```

### 13. Keep cloud cost safety in mind

Architecture and local validation work should not create AWS resources.

Cloud resources such as EKS, RDS, NAT Gateway, Load Balancers, ECR, and related AWS services may generate cost.

Keep cost-generating resources disabled by default unless explicitly needed for testing.

Destroy or disable temporary cloud resources after validation.

## Target backend direction

Long-term backend structure should move toward feature-based modules plus shared/core infrastructure.

Target direction:

```text
services/backend/app
├── main.py
├── api
│   └── router.py
├── core
│   ├── config.py
│   ├── errors.py
│   ├── logging.py
│   └── security.py
├── db
│   ├── database.py
│   ├── dependencies.py
│   └── init_db.py
├── shared
│   ├── repository.py
│   └── pagination.py
├── features
│   ├── auth
│   ├── users
│   └── tasks
└── middleware
```

The exact structure should evolve step by step. Do not create empty layers.

## Target frontend direction

Long-term frontend structure should move toward feature-based modules plus shared application infrastructure.

Target direction:

```text
apps/frontend/src
├── app
├── shared
│   ├── api
│   ├── components
│   └── types
├── features
│   ├── auth
│   ├── system
│   └── tasks
└── main.tsx
```

The exact structure should evolve step by step. Do not create empty layers.

## Refactor checklist

Before each architecture change, ask:

```text
Does this separation have a real purpose?
Is this code feature-specific or shared?
Is this file becoming too large?
Is this function doing too many things?
Is this value hardcoded?
Can this be configured or centralized?
Does this change behavior?
Will tests remain green?
```

If the answer is unclear, prefer the simpler solution.
