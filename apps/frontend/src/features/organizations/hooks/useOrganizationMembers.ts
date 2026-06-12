import { useState } from "react";
import { getErrorMessage } from "../../../shared/api/errors";
import {
  addOrganizationMember,
  getOrganizationMembers
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
  clearMembers: () => void;
};

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
    clearMembers
  };
}
