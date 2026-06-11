import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { useAppController } from "./hooks/useAppController";
import { DashboardRoute } from "./routes/DashboardRoute";
import { SystemRoute } from "./routes/SystemRoute";
import { WorkspacesRoute } from "./routes/WorkspacesRoute";
import { WorkspaceTasksRoute } from "./routes/WorkspaceTasksRoute";
import { WorkspaceDashboardRoute } from "./routes/WorkspaceDashboardRoute";

export function App() {
  const controller = useAppController();

  return (
    <AppLayout
      currentUser={controller.currentUser}
      organizations={controller.organizations}
      selectedOrganization={controller.selectedOrganization}
      isOrganizationsLoading={controller.isOrganizationsLoading}
      onSelectOrganization={controller.handleSelectOrganization}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={<DashboardRoute controller={controller} />}
        />
        <Route
          path="/workspaces"
          element={<WorkspacesRoute controller={controller} />}
        />
        <Route
          path="/workspaces/:workspaceId/dashboard"
          element={<WorkspaceDashboardRoute controller={controller} />}
        />
        <Route
          path="/workspaces/:workspaceId/tasks"
          element={<WorkspaceTasksRoute controller={controller} />}
        />
        <Route
          path="/system"
          element={<SystemRoute controller={controller} />}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}
