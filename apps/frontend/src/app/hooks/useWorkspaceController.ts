import { useNavigate } from "react-router-dom";
import type { User } from "../../features/auth/types";
import { useOrganizationMembers } from "../../features/organizations/hooks/useOrganizationMembers";
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

  const {
    members,
    isMembersLoading,
    isMemberSubmitting,
    loadMembers,
    addMember,
    clearMembers
  } = useOrganizationMembers();

  async function handleCreateOrganization(name: string): Promise<void> {
    if (!currentUser) {
      showMessage("Please login before creating workspaces.", "error");
      return;
    }

    showMessage("Creating workspace...", "muted");

    const result = await createUserOrganization(name);

    showMessage(result.message, result.success ? "success" : "error");

    if (result.success && result.organization) {
      await loadWorkspaceMembers(result.organization.id);
      navigate(`/workspaces/${result.organization.id}/tasks`);
    }
  }

  function handleSelectOrganization(
    organizationId: number,
    targetPath?: string
  ): void {
    selectOrganization(organizationId);
    void loadWorkspaceMembers(organizationId);
    navigate(targetPath ?? `/workspaces/${organizationId}/dashboard`);
  }

  function selectWorkspaceFromRoute(organizationId: number): void {
    selectOrganization(organizationId);
  }

  async function loadWorkspaceMembers(organizationId: number): Promise<void> {
    const result = await loadMembers(organizationId);

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handleAddWorkspaceMember(email: string): Promise<boolean> {
    if (!selectedOrganization) {
      showMessage("Please select a workspace first.", "error");

      return false;
    }

    const result = await addMember(selectedOrganization.id, email);

    showMessage(result.message, result.success ? "success" : "error");

    return result.success;
  }

  function clearWorkspaceState(): void {
    clearOrganizations();
    clearMembers();
  }

  return {
    organizations,
    selectedOrganization,
    isOrganizationsLoading,
    isOrganizationSubmitting,

    members,
    isMembersLoading,
    isMemberSubmitting,

    loadOrganizations,
    clearOrganizations,
    clearMembers,
    clearWorkspaceState,
    loadWorkspaceMembers,
    handleAddWorkspaceMember,

    handleCreateOrganization,
    handleSelectOrganization,
    selectWorkspaceFromRoute
  };
}

export type WorkspaceController = ReturnType<typeof useWorkspaceController>;
