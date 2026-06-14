import { useEffect, useRef } from "react";
import { WorkspaceMembersPanel } from "../../features/organizations/components/WorkspaceMembersPanel";
import { Message } from "../../shared/components/Message";
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
      loadTasks: false,
      loadMembers: true
    });

  const currentMember = controller.members.find(
    (member) => member.user_id === controller.currentUser?.id
  );
  const canManageInvitations = currentMember?.role === "owner";
  const loadedInvitationsWorkspaceIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!routeWorkspace || !canManageInvitations) {
      loadedInvitationsWorkspaceIdRef.current = null;
      return;
    }

    if (loadedInvitationsWorkspaceIdRef.current === routeWorkspace.id) {
      return;
    }

    loadedInvitationsWorkspaceIdRef.current = routeWorkspace.id;
    void controller.loadWorkspaceInvitations(routeWorkspace.id);
  }, [canManageInvitations, routeWorkspace?.id]);

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
        invitations={controller.invitations}
        isLoading={controller.isMembersLoading}
        isInvitationsLoading={controller.isInvitationsLoading}
        isInvitationSubmitting={controller.isInvitationSubmitting}
        canManageInvitations={canManageInvitations}
        onCreateInvitation={controller.handleCreateWorkspaceInvitation}
        onCancelInvitation={controller.handleCancelWorkspaceInvitation}
      />
    </>
  );
}
