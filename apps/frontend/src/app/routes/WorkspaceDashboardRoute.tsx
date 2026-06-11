import { DashboardPage } from "../../features/dashboard/components/DashboardPage";
import { WorkspaceMembersPanel } from "../../features/organizations/components/WorkspaceMembersPanel";
import { Message } from "../../shared/components/Message";
import type { AppController } from "../hooks/useAppController";
import { useWorkspaceRouteContext } from "./useWorkspaceRouteContext";

type WorkspaceDashboardRouteProps = {
  controller: AppController;
};

export function WorkspaceDashboardRoute({
  controller
}: WorkspaceDashboardRouteProps) {
  const { routeWorkspace, isLoadingWorkspaceContext } =
    useWorkspaceRouteContext({
      controller,
      loadTasks: true
    });

  if (isLoadingWorkspaceContext) {
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

      <WorkspaceMembersPanel
        members={controller.members}
        isLoading={controller.isMembersLoading}
      />
    </>
  );
}
