import { useState } from "react";
import { getOrganizationDashboardSummary } from "../api";
import { getErrorMessage } from "../../../shared/api/errors";
import type { OrganizationDashboardSummary, OrganizationRef } from "../types";

export type OrganizationDashboardSummaryActionResult = {
  success: boolean;
  message: string;
};

export type UseOrganizationDashboardSummaryResult = {
  dashboardSummary: OrganizationDashboardSummary | null;
  isDashboardSummaryLoading: boolean;
  loadDashboardSummary: (
    organizationRef: OrganizationRef
  ) => Promise<OrganizationDashboardSummaryActionResult>;
  clearDashboardSummary: () => void;
};

export function useOrganizationDashboardSummary(): UseOrganizationDashboardSummaryResult {
  const [dashboardSummary, setDashboardSummary] =
    useState<OrganizationDashboardSummary | null>(null);
  const [isDashboardSummaryLoading, setIsDashboardSummaryLoading] =
    useState(false);

  async function loadDashboardSummary(
    organizationRef: OrganizationRef
  ): Promise<OrganizationDashboardSummaryActionResult> {
    setIsDashboardSummaryLoading(true);

    try {
      const loadedDashboardSummary =
        await getOrganizationDashboardSummary(organizationRef);

      setDashboardSummary(loadedDashboardSummary);

      return {
        success: true,
        message: "Workspace dashboard summary loaded successfully."
      };
    } catch (error) {
      setDashboardSummary(null);

      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsDashboardSummaryLoading(false);
    }
  }

  function clearDashboardSummary(): void {
    setDashboardSummary(null);
    setIsDashboardSummaryLoading(false);
  }

  return {
    dashboardSummary,
    isDashboardSummaryLoading,
    loadDashboardSummary,
    clearDashboardSummary
  };
}
