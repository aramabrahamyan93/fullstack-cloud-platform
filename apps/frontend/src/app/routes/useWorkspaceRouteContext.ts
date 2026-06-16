import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrganization } from "../../features/organizations/api";
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
  loadMembers?: boolean;
};

export function useWorkspaceRouteContext({
  controller,
  loadTasks = false,
  loadMembers = false
}: UseWorkspaceRouteContextOptions): WorkspaceRouteContext {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const [invalidWorkspaceId, setInvalidWorkspaceId] = useState<number | null>(
    null
  );
  const [validatingWorkspaceId, setValidatingWorkspaceId] = useState<
    number | null
  >(null);

  const numericWorkspaceId = Number(workspaceId);
  const isValidWorkspaceId =
    Number.isInteger(numericWorkspaceId) && numericWorkspaceId > 0;

  const routeWorkspaceFromState =
    controller.organizations.find(
      (organization) => organization.id === numericWorkspaceId
    ) ?? null;

  const routeWorkspace =
    invalidWorkspaceId === numericWorkspaceId ? null : routeWorkspaceFromState;

  const isLoadingWorkspaceContext =
    controller.isAuthLoading ||
    controller.isOrganizationsLoading ||
    validatingWorkspaceId === numericWorkspaceId;

  useEffect(() => {
    setInvalidWorkspaceId(null);
    setValidatingWorkspaceId(null);
  }, [workspaceId]);

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

    if (!routeWorkspaceFromState) {
      controller.showMessage("Workspace was not found.", "error");
      navigate("/workspaces", { replace: true });
      return;
    }

    let isCancelled = false;

    async function validateWorkspaceAccess(): Promise<void> {
      setValidatingWorkspaceId(numericWorkspaceId);

      try {
        await getOrganization(numericWorkspaceId);

        if (isCancelled) {
          return;
        }

        setInvalidWorkspaceId(null);

        if (controller.selectedOrganization?.id !== numericWorkspaceId) {
          controller.selectWorkspaceFromRoute(numericWorkspaceId);
        }

        if (
          loadTasks &&
          controller.activeTaskOrganizationId !== numericWorkspaceId
        ) {
          void controller.loadWorkspaceTasks(numericWorkspaceId);
        }

        if (loadMembers) {
          void controller.loadWorkspaceMembers(numericWorkspaceId);
        }
      } catch {
        if (isCancelled) {
          return;
        }

        setInvalidWorkspaceId(numericWorkspaceId);
        controller.showMessage("Workspace was not found.", "error");
        controller.clearMembers();
        controller.clearInvitations();
        controller.clearTasks();

        await controller.loadOrganizations();

        navigate("/workspaces", { replace: true });
      } finally {
        if (!isCancelled) {
          setValidatingWorkspaceId(null);
        }
      }
    }

    void validateWorkspaceAccess();

    return () => {
      isCancelled = true;
    };
  }, [
    workspaceId,
    numericWorkspaceId,
    isValidWorkspaceId,
    controller.isAuthLoading,
    controller.isOrganizationsLoading,
    controller.currentUser?.id,
    controller.organizations.length,
    routeWorkspaceFromState?.id,
    controller.selectedOrganization?.id,
    controller.activeTaskOrganizationId,
    loadTasks,
    loadMembers,
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
