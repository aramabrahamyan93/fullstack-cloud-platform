import { useNavigate } from "react-router-dom";
import type { User } from "../../features/auth/types";
import { useMyOrganizationInvitations } from "../../features/organizations/hooks/useMyOrganizationInvitations";
import { useOrganizationInviteCandidates } from "../../features/organizations/hooks/useOrganizationInviteCandidates";
import { useOrganizationInvitations } from "../../features/organizations/hooks/useOrganizationInvitations";
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
    createUserOrganization,
    renameUserOrganization
  } = useOrganizations();

  const {
    members,
    isMembersLoading,
    isMemberSubmitting,
    loadMembers,
    removeMember,
    transferOwnership,
    leaveWorkspace,
    clearMembers
  } = useOrganizationMembers();

  const {
    invitations,
    isInvitationsLoading,
    isInvitationSubmitting,
    loadInvitations,
    createInvitation,
    cancelInvitation,
    clearInvitations
  } = useOrganizationInvitations();

  const {
    inviteCandidates,
    isInviteCandidatesLoading,
    loadInviteCandidates,
    clearInviteCandidates
  } = useOrganizationInviteCandidates();

  const {
    myInvitations,
    isMyInvitationsLoading,
    isMyInvitationSubmitting,
    loadMyInvitations,
    acceptMyInvitation,
    declineMyInvitation,
    clearMyInvitations
  } = useMyOrganizationInvitations();

  async function handleRenameWorkspace(name: string): Promise<boolean> {
    if (!selectedOrganization) {
      showMessage("Please select a workspace first.", "error");
      return false;
    }

    const result = await renameUserOrganization(selectedOrganization.id, name);

    showMessage(result.message, result.success ? "success" : "error");

    return result.success;
  }

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
      navigate(`/workspaces/${result.organization.id}/dashboard`);
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

  

  async function handleRemoveWorkspaceMember(memberId: number): Promise<void> {
    if (!selectedOrganization) {
      showMessage("Please select a workspace first.", "error");

      return;
    }

    const confirmed = window.confirm(
      "Remove this member from the workspace?"
    );

    if (!confirmed) {
      return;
    }

    const result = await removeMember(selectedOrganization.id, memberId);

    showMessage(result.message, result.success ? "success" : "error");
  }

  async function handleTransferWorkspaceOwnership(
    memberId: number
  ): Promise<void> {
    if (!selectedOrganization) {
      showMessage("Please select a workspace first.", "error");

      return;
    }

    const confirmed = window.confirm(
      "Transfer workspace ownership to this member? You will become a regular member."
    );

    if (!confirmed) {
      return;
    }

    const result = await transferOwnership(selectedOrganization.id, memberId);

    showMessage(result.message, result.success ? "success" : "error");

    if (result.success) {
      await loadOrganizations();
    }
  }

  async function leaveWorkspaceById(organizationId: number): Promise<void> {
    const confirmed = window.confirm(
      "Leave this workspace? You will lose access to its tasks and members."
    );

    if (!confirmed) {
      return;
    }

    const result = await leaveWorkspace(organizationId);

    showMessage(result.message, result.success ? "success" : "error");

    if (result.success) {
      clearMembers();
      clearInvitations();
      clearInviteCandidates();
      await loadOrganizations();
      navigate("/workspaces");
    }
  }

  async function handleLeaveWorkspace(): Promise<void> {
    if (!selectedOrganization) {
      showMessage("Please select a workspace first.", "error");

      return;
    }

    await leaveWorkspaceById(selectedOrganization.id);
  }

  async function handleLeaveWorkspaceById(organizationId: number): Promise<void> {
    await leaveWorkspaceById(organizationId);
  }

  async function loadWorkspaceInvitations(organizationId: number): Promise<void> {
    const result = await loadInvitations(organizationId);

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handleCreateWorkspaceInvitation(email: string): Promise<boolean> {
    if (!selectedOrganization) {
      showMessage("Please select a workspace first.", "error");

      return false;
    }

    const result = await createInvitation(selectedOrganization.id, email);

    showMessage(result.message, result.success ? "success" : "error");

    if (result.success) {
      await loadInviteCandidates(selectedOrganization.id, email);
    }

    return result.success;
  }

  async function handleSearchWorkspaceInviteCandidates(
    query: string
  ): Promise<void> {
    if (!selectedOrganization) {
      clearInviteCandidates();
      return;
    }

    const result = await loadInviteCandidates(selectedOrganization.id, query);

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handleCancelWorkspaceInvitation(
    invitationId: number
  ): Promise<void> {
    if (!selectedOrganization) {
      showMessage("Please select a workspace first.", "error");

      return;
    }

    const result = await cancelInvitation(selectedOrganization.id, invitationId);

    showMessage(result.message, result.success ? "success" : "error");
  }

  async function loadCurrentUserInvitations(): Promise<void> {
    if (!currentUser) {
      clearMyInvitations();
      return;
    }

    const result = await loadMyInvitations();

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handleAcceptMyInvitation(invitationId: number): Promise<void> {
    const result = await acceptMyInvitation(invitationId);

    showMessage(result.message, result.success ? "success" : "error");

    if (result.success) {
      await loadOrganizations();

      if (result.member) {
        await loadWorkspaceMembers(result.member.organization_id);
      }
    }
  }

  async function handleDeclineMyInvitation(invitationId: number): Promise<void> {
    const result = await declineMyInvitation(invitationId);

    showMessage(result.message, result.success ? "success" : "error");
  }

  function clearWorkspaceState(): void {
    clearOrganizations();
    clearMembers();
    clearInvitations();
    clearInviteCandidates();
    clearMyInvitations();
  }

  return {
    organizations,
    selectedOrganization,
    isOrganizationsLoading,
    isOrganizationSubmitting,

    members,
    isMembersLoading,
    isMemberSubmitting,

    invitations,
    isInvitationsLoading,
    isInvitationSubmitting,

    inviteCandidates,
    isInviteCandidatesLoading,

    myInvitations,
    isMyInvitationsLoading,
    isMyInvitationSubmitting,

    loadOrganizations,
    clearOrganizations,
    clearMembers,
    clearInvitations,
    clearWorkspaceState,
    loadWorkspaceMembers,
    loadWorkspaceInvitations,
    handleRemoveWorkspaceMember,
    handleTransferWorkspaceOwnership,
    handleLeaveWorkspace,
    handleLeaveWorkspaceById,
    handleCreateWorkspaceInvitation,
    handleCancelWorkspaceInvitation,
    handleSearchWorkspaceInviteCandidates,

    loadCurrentUserInvitations,
    handleAcceptMyInvitation,
    handleDeclineMyInvitation,

    handleCreateOrganization,
    handleRenameWorkspace,
    handleSelectOrganization,
    selectWorkspaceFromRoute
  };
}

export type WorkspaceController = ReturnType<typeof useWorkspaceController>;
