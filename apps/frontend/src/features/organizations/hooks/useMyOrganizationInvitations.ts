import { useState } from "react";
import { getErrorCode, getErrorMessage } from "../../../shared/api/errors";
import {
  acceptMyOrganizationInvitation,
  declineMyOrganizationInvitation,
  getMyOrganizationInvitations
} from "../api";
import type {
  MyInvitationActionResult,
  OrganizationInvitation,
  OrganizationMember
} from "../types";

export type UseMyOrganizationInvitationsResult = {
  myInvitations: OrganizationInvitation[];
  isMyInvitationsLoading: boolean;
  isMyInvitationSubmitting: boolean;
  loadMyInvitations: () => Promise<MyInvitationActionResult>;
  acceptMyInvitation: (
    invitationId: number
  ) => Promise<MyInvitationActionResult & { member?: OrganizationMember }>;
  declineMyInvitation: (
    invitationId: number
  ) => Promise<MyInvitationActionResult>;
  clearMyInvitations: () => void;
};

function getInvitationActionErrorMessage(error: unknown): string {
  const code = getErrorCode(error);

  if (code === "workspace_invitation_not_pending") {
    return "This invitation is no longer pending.";
  }

  if (code === "workspace_invitation_expired") {
    return "This invitation has expired.";
  }

  return getErrorMessage(error);
}

export function useMyOrganizationInvitations(): UseMyOrganizationInvitationsResult {
  const [myInvitations, setMyInvitations] = useState<OrganizationInvitation[]>([]);
  const [isMyInvitationsLoading, setIsMyInvitationsLoading] = useState(false);
  const [isMyInvitationSubmitting, setIsMyInvitationSubmitting] = useState(false);

  async function loadMyInvitations(): Promise<MyInvitationActionResult> {
    setIsMyInvitationsLoading(true);

    try {
      const loadedInvitations = await getMyOrganizationInvitations();

      setMyInvitations(loadedInvitations);

      return {
        success: true,
        message: "Invitations loaded successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsMyInvitationsLoading(false);
    }
  }

  async function acceptMyInvitation(
    invitationId: number
  ): Promise<MyInvitationActionResult & { member?: OrganizationMember }> {
    setIsMyInvitationSubmitting(true);

    try {
      const member = await acceptMyOrganizationInvitation(invitationId);

      await loadMyInvitations();

      return {
        success: true,
        message: "Workspace invitation accepted successfully.",
        member
      };
    } catch (error) {
      return {
        success: false,
        message: getInvitationActionErrorMessage(error)
      };
    } finally {
      setIsMyInvitationSubmitting(false);
    }
  }

  async function declineMyInvitation(
    invitationId: number
  ): Promise<MyInvitationActionResult> {
    setIsMyInvitationSubmitting(true);

    try {
      await declineMyOrganizationInvitation(invitationId);

      await loadMyInvitations();

      return {
        success: true,
        message: "Workspace invitation declined successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: getInvitationActionErrorMessage(error)
      };
    } finally {
      setIsMyInvitationSubmitting(false);
    }
  }

  function clearMyInvitations(): void {
    setMyInvitations([]);
    setIsMyInvitationsLoading(false);
    setIsMyInvitationSubmitting(false);
  }

  return {
    myInvitations,
    isMyInvitationsLoading,
    isMyInvitationSubmitting,
    loadMyInvitations,
    acceptMyInvitation,
    declineMyInvitation,
    clearMyInvitations
  };
}
