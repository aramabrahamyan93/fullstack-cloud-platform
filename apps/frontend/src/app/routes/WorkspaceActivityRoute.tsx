import { useEffect, useRef } from "react";
import { WorkspaceActivityPage } from "../../features/organizations/components/WorkspaceActivityPage";
import { Message } from "../../shared/components/Message";
import type { AppController } from "../hooks/useAppController";
import { useWorkspaceRouteContext } from "./useWorkspaceRouteContext";

type WorkspaceActivityRouteProps = {
  controller: AppController;
};

export function WorkspaceActivityRoute({
  controller
}: WorkspaceActivityRouteProps) {
  const { routeWorkspace, isLoadingWorkspaceContext } =
    useWorkspaceRouteContext({
      controller,
      loadTasks: false,
      loadMembers: false
    });

  const loadedAuditLogsWorkspaceIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!routeWorkspace) {
      loadedAuditLogsWorkspaceIdRef.current = null;
      controller.clearAuditLogs();
      return;
    }

    if (loadedAuditLogsWorkspaceIdRef.current === routeWorkspace.id) {
      return;
    }

    loadedAuditLogsWorkspaceIdRef.current = routeWorkspace.id;
    void controller.loadWorkspaceAuditLogs(routeWorkspace.id);
  }, [routeWorkspace?.id]);

  if (isLoadingWorkspaceContext) {
    return (
      <section className="card">
        <div className="card-header">
          <div>
            <h1>Workspace Activity</h1>
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
              <h1>Workspace Activity</h1>
              <p className="card-subtitle">
                Login or register to view workspace activity.
              </p>
            </div>
          </div>

          <div className="empty-state">Please login or register first.</div>
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
              <h1>Workspace Activity</h1>
              <p className="card-subtitle">
                Select a workspace before viewing activity.
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
          <h1>{routeWorkspace.name} Activity</h1>
          <p className="card-subtitle">
            Read-only audit history for this workspace.
          </p>
        </div>
      </section>

      <WorkspaceActivityPage
        workspace={routeWorkspace}
        auditLogs={controller.auditLogs}
        isLoading={controller.isAuditLogsLoading}
      />
    </>
  );
}
