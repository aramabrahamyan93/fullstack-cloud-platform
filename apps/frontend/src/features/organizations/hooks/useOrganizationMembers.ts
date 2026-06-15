import { useState } from "react";
import { getErrorCode, getErrorMessage } from "../../../shared/api/errors";
import {
  addOrganizationMember,
  getOrganizationMembers,
  leaveOrganization,
  removeOrganizationMember,
  transferOrganizationOwnership
} from "../api";
import type { OrganizationMember } from "../types";

export type OrganizationMembersActionResult = {
  success: boolean;
  message: string;
};

export type UseOrganizationMembersResult = {
  members: OrganizationMember[];
  isMembersLoading: boolean;
  isMemberSubmitting: boolean;
  loadMembers: (
    organizationId: number
  ) => Promise<OrganizationMembersActionResult>;
  addMember: (
    organizationId: number,
    email: string
  ) => Promise<OrganizationMembersActionResult>;
  removeMember: (
    organizationId: number,
    memberId: number
  ) => Promise<OrganizationMembersActionResult>;
  transferOwnership: (
    organizationId: number,
    memberId: number
  ) => Promise<OrganizationMembersActionResult>;
  leaveWorkspace: (
    organizationId: number
  ) => Promise<OrganizationMembersActionResult>;
  clearMembers: () => void;
};

function getAddMemberErrorMessage(error: unknown): string {
  const code = getErrorCode(error);

  if (code === "workspace_member_user_not_registered") {
    return "This user must register before you can add them to the workspace.";
  }

  if (code === "workspace_member_already_exists") {
    return "This user is already a member of this workspace.";
  }

  if (code === "workspace_member_self_add_not_allowed") {
    return "You are already the workspace owner.";
  }

  if (code === "workspace_member_invalid_role") {
    return "Only members can be added from this form.";
  }

  return getErrorMessage(error);
}

export function useOrganizationMembers(): UseOrganizationMembersResult {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [isMemberSubmitting, setIsMemberSubmitting] = useState(false);

  async function loadMembers(
    organizationId: number
  ): Promise<OrganizationMembersActionResult> {
    setIsMembersLoading(true);

    try {
      const loadedMembers = await getOrganizationMembers(organizationId);

      setMembers(loadedMembers);

      return {
        success: true,
        message: "Workspace members loaded successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsMembersLoading(false);
    }
  }

  async function addMember(
    organizationId: number,
    email: string
  ): Promise<OrganizationMembersActionResult> {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      return {
        success: false,
        message: "Member email is required."
      };
    }

    setIsMemberSubmitting(true);

    try {
      await addOrganizationMember(organizationId, {
        email: normalizedEmail,
        role: "member"
      });

      await loadMembers(organizationId);

      return {
        success: true,
        message: "Workspace member added successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: getAddMemberErrorMessage(error)
      };
    } finally {
      setIsMemberSubmitting(false);
    }
  }

  async function removeMember(
    organizationId: number,
    memberId: number
  ): Promise<OrganizationMembersActionResult> {
    setIsMemberSubmitting(true);

    try {
      await removeOrganizationMember(organizationId, memberId);
      await loadMembers(organizationId);

      return {
        success: true,
        message: "Workspace member removed successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsMemberSubmitting(false);
    }
  }

  async function transferOwnership(
    organizationId: number,
    memberId: number
  ): Promise<OrganizationMembersActionResult> {
    setIsMemberSubmitting(true);

    try {
      await transferOrganizationOwnership(organizationId, memberId);
      await loadMembers(organizationId);

      return {
        success: true,
        message: "Workspace ownership transferred successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsMemberSubmitting(false);
    }
  }

  async function leaveWorkspace(
    organizationId: number
  ): Promise<OrganizationMembersActionResult> {
    setIsMemberSubmitting(true);

    try {
      await leaveOrganization(organizationId);

      setMembers([]);

      return {
        success: true,
        message: "You left the workspace successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsMemberSubmitting(false);
    }
  }

  function clearMembers(): void {
    setMembers([]);
    setIsMembersLoading(false);
    setIsMemberSubmitting(false);
  }

  return {
    members,
    isMembersLoading,
    isMemberSubmitting,
    loadMembers,
    addMember,
    removeMember,
    transferOwnership,
    leaveWorkspace,
    clearMembers
  };
}
