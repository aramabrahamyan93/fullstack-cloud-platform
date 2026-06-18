# Public ID related files

Backend public ID foundation:

```text
services/backend/app/core/public_ids.py
services/backend/app/features/organizations/models.py
services/backend/app/features/organizations/repository.py
services/backend/app/features/organizations/service.py
services/backend/app/features/organizations/router.py
services/backend/app/features/organizations/tasks_router.py
services/backend/tests/test_organization_public_ids.py
services/backend/tests/test_organization_remaining_public_api_routes.py
services/backend/tests/test_organization_task_public_api_routes.py
```

Frontend public ID usage:

```text
apps/frontend/src/features/organizations/types.ts
apps/frontend/src/features/organizations/api.ts
apps/frontend/src/features/organizations/hooks/
apps/frontend/src/features/tasks/api.ts
apps/frontend/src/features/tasks/hooks/useTasks.ts
apps/frontend/src/app/hooks/useWorkspaceController.ts
apps/frontend/src/app/hooks/useTaskController.ts
apps/frontend/src/app/routes/useWorkspaceRouteContext.ts
apps/frontend/src/shared/components/Sidebar.tsx
```
