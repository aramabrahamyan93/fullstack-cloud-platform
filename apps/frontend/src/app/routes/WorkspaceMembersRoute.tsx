import { Message } from "../../shared/components/Message";
import { WorkspaceMembersPanel } from "../../features/organizations/components/WorkspaceMembersPanel";
import type { AppController } from "../hooks/useAppController";
import { useWorkspaceRouteContext } from "./useWorkspaceRouteContext";

type WorkspaceMembersRouteProps = {
  controller: AppController;
};

export function WorkspaceMembersRoute({
  controller
}: WorkspaceMembersRouteProps) {
  const { routeWorkspace, isLoadingWorkspaceContext } =
    useWorkspaceRouteContext({
      controller,
      loadTasks: false
    });

  if (isLoadingWorkspaceContext) {
    return (
      <section className="card">
        <div className="card-header">
          <div>
            <h1>Workspace Members</h1>
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
              <h1>Workspace Members</h1>
              <p className="card-subtitle">
                Login or register to view workspace members.
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
              <h1>Workspace Members</h1>
              <p className="card-subtitle">
                Select a workspace before viewing members.
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
          <h1>{routeWorkspace.name} Members</h1>
          <p className="card-subtitle">
            Manage people who have access to this workspace.
          </p>
        </div>
      </section>

      <WorkspaceMembersPanel
        members={controller.members}
        isLoading={controller.isMembersLoading}
      />
    </>
  );
}
