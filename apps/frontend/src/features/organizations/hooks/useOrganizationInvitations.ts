import { useState } from "react";
import { getErrorCode, getErrorMessage } from "../../../shared/api/errors";
import {
  cancelOrganizationInvitation,
  createOrganizationInvitation,
  getOrganizationInvitations
} from "../api";
import type { OrganizationInvitation } from "../types";

export type OrganizationInvitationsActionResult = {
  success: boolean;
  message: string;
};

export type UseOrganizationInvitationsResult = {
  invitations: OrganizationInvitation[];
  isInvitationsLoading: boolean;
  isInvitationSubmitting: boolean;
  loadInvitations: (
    organizationId: number
  ) => Promise<OrganizationInvitationsActionResult>;
  createInvitation: (
    organizationId: number,
    email: string
  ) => Promise<OrganizationInvitationsActionResult>;
  cancelInvitation: (
    organizationId: number,
    invitationId: number
  ) => Promise<OrganizationInvitationsActionResult>;
  clearInvitations: () => void;
};

function getCreateInvitationErrorMessage(error: unknown): string {
  const code = getErrorCode(error);

  if (code === "workspace_invitation_already_pending") {
    return "A pending invitation already exists for this email.";
  }

  if (code === "workspace_invitation_user_already_member") {
    return "This user is already a member of this workspace.";
  }

  if (code === "workspace_invitation_invalid_role") {
    return "Only members can be invited from this form.";
  }

  return getErrorMessage(error);
}

export function useOrganizationInvitations(): UseOrganizationInvitationsResult {
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [isInvitationsLoading, setIsInvitationsLoading] = useState(false);
  const [isInvitationSubmitting, setIsInvitationSubmitting] = useState(false);

  async function loadInvitations(
    organizationId: number
  ): Promise<OrganizationInvitationsActionResult> {
    setIsInvitationsLoading(true);

    try {
      const loadedInvitations = await getOrganizationInvitations(organizationId);

      setInvitations(loadedInvitations);

      return {
        success: true,
        message: "Workspace invitations loaded successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsInvitationsLoading(false);
    }
  }

  async function createInvitation(
    organizationId: number,
    email: string
  ): Promise<OrganizationInvitationsActionResult> {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      return {
        success: false,
        message: "Invitation email is required."
      };
    }

    setIsInvitationSubmitting(true);

    try {
      await createOrganizationInvitation(organizationId, {
        email: normalizedEmail,
        role: "member"
      });

      await loadInvitations(organizationId);

      return {
        success: true,
        message: "Workspace invitation created successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: getCreateInvitationErrorMessage(error)
      };
    } finally {
      setIsInvitationSubmitting(false);
    }
  }

  async function cancelInvitation(
    organizationId: number,
    invitationId: number
  ): Promise<OrganizationInvitationsActionResult> {
    setIsInvitationSubmitting(true);

    try {
      await cancelOrganizationInvitation(organizationId, invitationId);
      await loadInvitations(organizationId);

      return {
        success: true,
        message: "Workspace invitation cancelled successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsInvitationSubmitting(false);
    }
  }

  function clearInvitations(): void {
    setInvitations([]);
    setIsInvitationsLoading(false);
    setIsInvitationSubmitting(false);
  }

  return {
    invitations,
    isInvitationsLoading,
    isInvitationSubmitting,
    loadInvitations,
    createInvitation,
    cancelInvitation,
    clearInvitations
  };
}
