import { useState } from "react";
import { getOrganizationAuditLogs } from "../api";
import { getErrorMessage } from "../../../shared/api/errors";
import type { OrganizationAuditLog } from "../types";

export type OrganizationAuditLogActionResult = {
  success: boolean;
  message: string;
};

export type UseOrganizationAuditLogsResult = {
  auditLogs: OrganizationAuditLog[];
  isAuditLogsLoading: boolean;
  loadAuditLogs: (
    organizationId: number
  ) => Promise<OrganizationAuditLogActionResult>;
  clearAuditLogs: () => void;
};

export function useOrganizationAuditLogs(): UseOrganizationAuditLogsResult {
  const [auditLogs, setAuditLogs] = useState<OrganizationAuditLog[]>([]);
  const [isAuditLogsLoading, setIsAuditLogsLoading] = useState(false);

  async function loadAuditLogs(
    organizationId: number
  ): Promise<OrganizationAuditLogActionResult> {
    setIsAuditLogsLoading(true);

    try {
      const loadedAuditLogs = await getOrganizationAuditLogs(organizationId);

      setAuditLogs(loadedAuditLogs);

      return {
        success: true,
        message: "Workspace activity loaded successfully."
      };
    } catch (error) {
      setAuditLogs([]);

      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsAuditLogsLoading(false);
    }
  }

  function clearAuditLogs(): void {
    setAuditLogs([]);
    setIsAuditLogsLoading(false);
  }

  return {
    auditLogs,
    isAuditLogsLoading,
    loadAuditLogs,
    clearAuditLogs
  };
}
