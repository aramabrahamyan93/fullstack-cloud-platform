import { useState } from "react";
import { getErrorMessage } from "../../../shared/api/errors";
import { getOrganizationMembers } from "../api";
import type { OrganizationMember } from "../types";

export type OrganizationMembersActionResult = {
  success: boolean;
  message: string;
};

export type UseOrganizationMembersResult = {
  members: OrganizationMember[];
  isMembersLoading: boolean;
  loadMembers: (
    organizationId: number
  ) => Promise<OrganizationMembersActionResult>;
  clearMembers: () => void;
};

export function useOrganizationMembers(): UseOrganizationMembersResult {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);

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

  function clearMembers(): void {
    setMembers([]);
    setIsMembersLoading(false);
  }

  return {
    members,
    isMembersLoading,
    loadMembers,
    clearMembers
  };
}
