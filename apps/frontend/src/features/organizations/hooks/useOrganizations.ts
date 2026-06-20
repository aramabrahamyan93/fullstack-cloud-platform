import { useState } from "react";
import {
  archiveOrganization,
  createOrganization,
  getOrganizations,
  restoreOrganization,
  updateOrganization
} from "../api";
import { getErrorMessage } from "../../../shared/api/errors";
import type { Organization, OrganizationRef } from "../types";

export type OrganizationActionResult = {
  success: boolean;
  message: string;
  organization?: Organization;
};

export type UseOrganizationsResult = {
  organizations: Organization[];
  selectedOrganization: Organization | null;
  isOrganizationsLoading: boolean;
  isOrganizationSubmitting: boolean;
  loadOrganizations: () => Promise<OrganizationActionResult>;
  clearOrganizations: () => void;
  selectOrganization: (organizationId: number) => Organization | null;
  createUserOrganization: (
    name: string
  ) => Promise<OrganizationActionResult>;
  renameUserOrganization: (
    organizationRef: OrganizationRef,
    name: string
  ) => Promise<OrganizationActionResult>;
  archiveUserOrganization: (
    organizationRef: OrganizationRef
  ) => Promise<OrganizationActionResult>;
  restoreUserOrganization: (
    organizationRef: OrganizationRef
  ) => Promise<OrganizationActionResult>;
};

export function useOrganizations(): UseOrganizationsResult {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [isOrganizationsLoading, setIsOrganizationsLoading] = useState(false);
  const [isOrganizationSubmitting, setIsOrganizationSubmitting] =
    useState(false);

  async function loadOrganizations(): Promise<OrganizationActionResult> {
    setIsOrganizationsLoading(true);

    try {
      const loadedOrganizations = await getOrganizations();

      setOrganizations(loadedOrganizations);
      setSelectedOrganization((currentSelectedOrganization) => {
        if (loadedOrganizations.length === 0) {
          return null;
        }

        if (!currentSelectedOrganization) {
          return loadedOrganizations[0];
        }

        return (
          loadedOrganizations.find(
            (organization) => organization.id === currentSelectedOrganization.id
          ) ?? loadedOrganizations[0]
        );
      });

      return {
        success: true,
        message: "Workspaces loaded successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsOrganizationsLoading(false);
    }
  }

  function clearOrganizations(): void {
    setOrganizations([]);
    setSelectedOrganization(null);
    setIsOrganizationsLoading(false);
  }

  function selectOrganization(organizationId: number): Organization | null {
    const organization = organizations.find(
      (item) => item.id === organizationId
    ) ?? null;

    setSelectedOrganization(organization);

    return organization;
  }

  async function createUserOrganization(
    name: string
  ): Promise<OrganizationActionResult> {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return {
        success: false,
        message: "Workspace name is required."
      };
    }

    setIsOrganizationSubmitting(true);

    try {
      const organization = await createOrganization({
        name: normalizedName
      });

      setOrganizations((currentOrganizations) => [
        ...currentOrganizations,
        organization
      ]);
      setSelectedOrganization(organization);

      return {
        success: true,
        message: "Workspace created successfully.",
        organization
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsOrganizationSubmitting(false);
    }
  }

  async function renameUserOrganization(
    organizationRef: OrganizationRef,
    name: string
  ): Promise<OrganizationActionResult> {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return {
        success: false,
        message: "Workspace name is required."
      };
    }

    setIsOrganizationSubmitting(true);

    try {
      const organization = await updateOrganization(organizationRef, {
        name: normalizedName
      });

      setOrganizations((currentOrganizations) =>
        currentOrganizations.map((currentOrganization) =>
          currentOrganization.id === organization.id
            ? organization
            : currentOrganization
        )
      );

      setSelectedOrganization((currentSelectedOrganization) =>
        currentSelectedOrganization?.id === organization.id
          ? organization
          : currentSelectedOrganization
      );

      return {
        success: true,
        message: "Workspace renamed successfully.",
        organization
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsOrganizationSubmitting(false);
    }
  }

  async function archiveUserOrganization(
    organizationRef: OrganizationRef
  ): Promise<OrganizationActionResult> {
    setIsOrganizationSubmitting(true);

    try {
      const organization = await archiveOrganization(organizationRef);

      setOrganizations((currentOrganizations) =>
        currentOrganizations.map((currentOrganization) =>
          currentOrganization.id === organization.id
            ? organization
            : currentOrganization
        )
      );

      setSelectedOrganization((currentSelectedOrganization) =>
        currentSelectedOrganization?.id === organization.id
          ? organization
          : currentSelectedOrganization
      );

      return {
        success: true,
        message: "Workspace archived successfully.",
        organization
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsOrganizationSubmitting(false);
    }
  }

  async function restoreUserOrganization(
    organizationRef: OrganizationRef
  ): Promise<OrganizationActionResult> {
    setIsOrganizationSubmitting(true);

    try {
      const organization = await restoreOrganization(organizationRef);

      setOrganizations((currentOrganizations) =>
        currentOrganizations.map((currentOrganization) =>
          currentOrganization.id === organization.id
            ? organization
            : currentOrganization
        )
      );

      setSelectedOrganization((currentSelectedOrganization) =>
        currentSelectedOrganization?.id === organization.id
          ? organization
          : currentSelectedOrganization
      );

      return {
        success: true,
        message: "Workspace restored successfully.",
        organization
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsOrganizationSubmitting(false);
    }
  }

  return {
    organizations,
    selectedOrganization,
    isOrganizationsLoading,
    isOrganizationSubmitting,
    loadOrganizations,
    clearOrganizations,
    selectOrganization,
    createUserOrganization,
    renameUserOrganization,
    archiveUserOrganization,
    restoreUserOrganization
  };
}
