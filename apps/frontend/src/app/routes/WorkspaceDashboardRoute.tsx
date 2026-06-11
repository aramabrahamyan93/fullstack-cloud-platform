import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardPage } from "../../features/dashboard/components/DashboardPage";
import { Message } from "../../shared/components/Message";
import type { AppController } from "../hooks/useAppController";

type WorkspaceDashboardRouteProps = {
  controller: AppController;
};

export function WorkspaceDashboardRoute({
  controller
}: WorkspaceDashboardRouteProps) {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const numericWorkspaceId = Number(workspaceId);
  const isValidWorkspaceId =
    Number.isInteger(numericWorkspaceId) && numericWorkspaceId > 0;

  const routeWorkspace = controller.organizations.find(
    (organization) => organization.id === numericWorkspaceId
  );

  useEffect(() => {
    if (!workspaceId || !isValidWorkspaceId) {
      controller.showMessage("Invalid workspace route.", "error");
      navigate("/workspaces", { replace: true });
      return;
    }

    if (controller.isAuthLoading || controller.isOrganizationsLoading) {
      return;
    }

    if (!controller.currentUser) {
      return;
    }

    if (controller.organizations.length === 0) {
      return;
    }

    if (!routeWorkspace) {
      controller.showMessage("Workspace was not found.", "error");
      navigate("/workspaces", { replace: true });
      return;
    }

    if (controller.selectedOrganization?.id !== routeWorkspace.id) {
      controller.selectWorkspaceFromRoute(routeWorkspace.id);
    }

    if (controller.activeTaskOrganizationId !== routeWorkspace.id) {
      void controller.loadWorkspaceTasks(routeWorkspace.id);
    }
  }, [
    workspaceId,
    isValidWorkspaceId,
    routeWorkspace?.id,
    controller.isAuthLoading,
    controller.isOrganizationsLoading,
    controller.currentUser,
    controller.organizations.length,
    controller.selectedOrganization?.id,
    controller.activeTaskOrganizationId
  ]);

  if (controller.isAuthLoading || controller.isOrganizationsLoading) {
    return (
      <section className="card">
        <div className="card-header">
          <div>
            <h1>Workspace Dashboard</h1>
            <p className="card-subtitle">Loading workspace context...</p>
          </div>
        </div>

        <div className="empty-state">Please wait...</div>
      </section>
    );
  }

  if (!controller.currentUser) {
    return (
      <>
        <Message message={controller.message} />

        <section className="card">
          <div className="card-header">
            <div>
              <h1>Workspace Dashboard</h1>
              <p className="card-subtitle">
                Login or register to open a workspace dashboard.
              </p>
            </div>
          </div>

          <div className="empty-state">
            Please login or register first.
          </div>
        </section>
      </>
    );
  }

  if (!routeWorkspace) {
    return (
      <>
        <Message message={controller.message} />

        <section className="card">
          <div className="card-header">
            <div>
              <h1>Workspace Dashboard</h1>
              <p className="card-subtitle">
                Select a workspace before opening the dashboard.
              </p>
            </div>
          </div>

          <div className="empty-state">
            Please create or select a workspace first.
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Message message={controller.message} />

      <section className="page-header">
        <div>
          <h1>{routeWorkspace.name}</h1>
          <p className="card-subtitle">
            Workspace dashboard and task overview.
          </p>
        </div>
      </section>

      <DashboardPage
        currentUser={controller.currentUser}
        taskCounters={controller.taskCounters}
      />
    </>
  );
}
