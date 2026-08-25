import { useState } from "react";
import { getErrorMessage } from "../../../shared/api/errors";
import { getOrganizationInviteCandidates } from "../api";
import type { OrganizationInviteCandidate, OrganizationRef } from "../types";

export type InviteCandidatesActionResult = {
  success: boolean;
  message: string;
};

export type UseOrganizationInviteCandidatesResult = {
  inviteCandidates: OrganizationInviteCandidate[];
  isInviteCandidatesLoading: boolean;
  loadInviteCandidates: (
    organizationId: OrganizationRef,
    query: string
  ) => Promise<InviteCandidatesActionResult>;
  clearInviteCandidates: () => void;
};

export function useOrganizationInviteCandidates(): UseOrganizationInviteCandidatesResult {
  const [inviteCandidates, setInviteCandidates] = useState<
    OrganizationInviteCandidate[]
  >([]);
  const [isInviteCandidatesLoading, setIsInviteCandidatesLoading] =
    useState(false);

  async function loadInviteCandidates(
    organizationId: OrganizationRef,
    query: string
  ): Promise<InviteCandidatesActionResult> {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setInviteCandidates([]);

      return {
        success: true,
        message: "Enter at least 2 characters to search."
      };
    }

    setIsInviteCandidatesLoading(true);

    try {
      const candidates = await getOrganizationInviteCandidates(
        organizationId,
        normalizedQuery
      );

      setInviteCandidates(candidates);

      return {
        success: true,
        message: "Invite candidates loaded successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsInviteCandidatesLoading(false);
    }
  }

  function clearInviteCandidates(): void {
    setInviteCandidates([]);
    setIsInviteCandidatesLoading(false);
  }

  return {
    inviteCandidates,
    isInviteCandidatesLoading,
    loadInviteCandidates,
    clearInviteCandidates
  };
}
