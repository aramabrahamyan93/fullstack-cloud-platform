import { WorkspaceSettingsPage } from "../../features/organizations/components/WorkspaceSettingsPage";
import { Message } from "../../shared/components/Message";
import type { AppController } from "../hooks/useAppController";
import { useWorkspaceRouteContext } from "./useWorkspaceRouteContext";

type WorkspaceSettingsRouteProps = {
  controller: AppController;
};

export function WorkspaceSettingsRoute({
  controller
}: WorkspaceSettingsRouteProps) {
  const { routeWorkspace, isLoadingWorkspaceContext } =
    useWorkspaceRouteContext({
      controller,
      loadTasks: false,
      loadMembers: true
    });

  const currentMember = controller.members.find(
    (member) => member.user_id === controller.currentUser?.id
  ) ?? null;

  if (isLoadingWorkspaceContext) {
    return (
      <section className="card">
        <div className="card-header">
          <div>
            <h1>Workspace Settings</h1>
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
              <h1>Workspace Settings</h1>
              <p className="card-subtitle">
                Login or register to view workspace settings.
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
              <h1>Workspace Settings</h1>
              <p className="card-subtitle">
                Select a workspace before opening settings.
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
          <h1>{routeWorkspace.name} Settings</h1>
          <p className="card-subtitle">
            Workspace configuration foundation.
          </p>
        </div>
      </section>

      <WorkspaceSettingsPage
        workspace={routeWorkspace}
        currentMember={currentMember}
        isSubmitting={controller.isMemberSubmitting}
        onLeaveWorkspace={controller.handleLeaveWorkspace}
      />
    </>
  );
}
