import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Organization } from "../../features/organizations/types";
import type { AppController } from "../hooks/useAppController";

type WorkspaceRouteContext = {
  workspaceId: string | undefined;
  numericWorkspaceId: number;
  isValidWorkspaceId: boolean;
  routeWorkspace: Organization | null;
  isLoadingWorkspaceContext: boolean;
};

type UseWorkspaceRouteContextOptions = {
  controller: AppController;
  loadTasks?: boolean;
};

export function useWorkspaceRouteContext({
  controller,
  loadTasks = false
}: UseWorkspaceRouteContextOptions): WorkspaceRouteContext {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const numericWorkspaceId = Number(workspaceId);
  const isValidWorkspaceId =
    Number.isInteger(numericWorkspaceId) && numericWorkspaceId > 0;

  const routeWorkspace =
    controller.organizations.find(
      (organization) => organization.id === numericWorkspaceId
    ) ?? null;

  const isLoadingWorkspaceContext =
    controller.isAuthLoading || controller.isOrganizationsLoading;

  useEffect(() => {
    if (!workspaceId || !isValidWorkspaceId) {
      controller.showMessage("Invalid workspace route.", "error");
      navigate("/workspaces", { replace: true });
      return;
    }

    if (isLoadingWorkspaceContext) {
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

    if (
      loadTasks &&
      controller.activeTaskOrganizationId !== routeWorkspace.id
    ) {
      void controller.loadWorkspaceTasks(routeWorkspace.id);
    }
  }, [
    workspaceId,
    isValidWorkspaceId,
    isLoadingWorkspaceContext,
    routeWorkspace?.id,
    controller.currentUser,
    controller.organizations.length,
    controller.selectedOrganization?.id,
    controller.activeTaskOrganizationId,
    loadTasks,
    navigate
  ]);

  return {
    workspaceId,
    numericWorkspaceId,
    isValidWorkspaceId,
    routeWorkspace,
    isLoadingWorkspaceContext
  };
}
