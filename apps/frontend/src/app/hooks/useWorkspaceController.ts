import { useNavigate } from "react-router-dom";
import type { User } from "../../features/auth/types";
import { useOrganizations } from "../../features/organizations/hooks/useOrganizations";
import type { MessageType } from "../../shared/components/Message";

type UseWorkspaceControllerOptions = {
  currentUser: User | null;
  showMessage: (text: string, type: MessageType) => void;
};

export function useWorkspaceController({
  currentUser,
  showMessage
}: UseWorkspaceControllerOptions) {
  const navigate = useNavigate();

  const {
    organizations,
    selectedOrganization,
    isOrganizationsLoading,
    isOrganizationSubmitting,
    loadOrganizations,
    clearOrganizations,
    selectOrganization,
    createUserOrganization
  } = useOrganizations();

  async function handleCreateOrganization(name: string): Promise<void> {
    if (!currentUser) {
      showMessage("Please login before creating workspaces.", "error");
      return;
    }

    showMessage("Creating workspace...", "muted");

    const result = await createUserOrganization(name);

    showMessage(result.message, result.success ? "success" : "error");

    if (result.success && result.organization) {
      navigate(`/workspaces/${result.organization.id}/tasks`);
    }
  }

  function handleSelectOrganization(organizationId: number): void {
    selectOrganization(organizationId);
    navigate(`/workspaces/${organizationId}/tasks`);
  }

  function selectWorkspaceFromRoute(organizationId: number): void {
    selectOrganization(organizationId);
  }

  return {
    organizations,
    selectedOrganization,
    isOrganizationsLoading,
    isOrganizationSubmitting,

    loadOrganizations,
    clearOrganizations,

    handleCreateOrganization,
    handleSelectOrganization,
    selectWorkspaceFromRoute
  };
}

export type WorkspaceController = ReturnType<typeof useWorkspaceController>;
