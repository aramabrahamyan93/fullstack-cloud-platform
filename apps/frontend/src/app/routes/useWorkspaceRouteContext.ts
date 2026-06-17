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

function isValidWorkspacePublicId(workspaceId: string | undefined): boolean {
  return Boolean(workspaceId && /^ws_[A-Za-z0-9_-]+$/.test(workspaceId));
}

export function useWorkspaceRouteContext({
  controller,
  loadTasks = false,
  loadMembers = false
}: UseWorkspaceRouteContextOptions): WorkspaceRouteContext {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const [invalidWorkspacePublicId, setInvalidWorkspacePublicId] = useState<
    string | null
  >(null);
  const [validatingWorkspacePublicId, setValidatingWorkspacePublicId] = useState<
    string | null
  >(null);

  const isValidWorkspaceId = isValidWorkspacePublicId(workspaceId);

  const routeWorkspaceFromState =
    controller.organizations.find(
      (organization) => organization.public_id === workspaceId
    ) ?? null;

  const routeWorkspace =
    invalidWorkspacePublicId === workspaceId ? null : routeWorkspaceFromState;

  const numericWorkspaceId = routeWorkspace?.id ?? 0;

  const isLoadingWorkspaceContext =
    controller.isAuthLoading ||
    controller.isOrganizationsLoading ||
    validatingWorkspacePublicId === workspaceId;

  useEffect(() => {
    setInvalidWorkspacePublicId(null);
    setValidatingWorkspacePublicId(null);
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

    const workspacePublicId = workspaceId;
    const resolvedWorkspace = routeWorkspaceFromState;

    let isCancelled = false;

    async function validateWorkspaceAccess(): Promise<void> {
      setValidatingWorkspacePublicId(workspacePublicId);

      try {
        await getOrganization(resolvedWorkspace.id);

        if (isCancelled) {
          return;
        }

        setInvalidWorkspacePublicId(null);

        if (controller.selectedOrganization?.id !== resolvedWorkspace.id) {
          controller.selectWorkspaceFromRoute(resolvedWorkspace.id);
        }

        if (
          loadTasks &&
          controller.activeTaskOrganizationId !== resolvedWorkspace.id
        ) {
          void controller.loadWorkspaceTasks(resolvedWorkspace.id);
        }

        if (loadMembers) {
          void controller.loadWorkspaceMembers(resolvedWorkspace.id);
        }
      } catch {
        if (isCancelled) {
          return;
        }

        setInvalidWorkspacePublicId(workspacePublicId);
        controller.showMessage("Workspace was not found.", "error");
        controller.clearMembers();
        controller.clearInvitations();
        controller.clearTasks();

        await controller.loadOrganizations();

        navigate("/workspaces", { replace: true });
      } finally {
        if (!isCancelled) {
          setValidatingWorkspacePublicId(null);
        }
      }
    }

    void validateWorkspaceAccess();

    return () => {
      isCancelled = true;
    };
  }, [
    workspaceId,
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
