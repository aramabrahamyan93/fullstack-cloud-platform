import { fetchJson } from "../../shared/api/client";
import type {
  AddOrganizationMemberRequest,
  CreateOrganizationRequest,
  Organization,
  OrganizationMember
} from "./types";

export function getOrganizations(): Promise<Organization[]> {
  return fetchJson<Organization[]>("/organizations");
}

export function getOrganization(
  organizationId: number
): Promise<Organization> {
  return fetchJson<Organization>(`/organizations/${organizationId}`);
}

export function createOrganization(
  payload: CreateOrganizationRequest
): Promise<Organization> {
  return fetchJson<Organization>("/organizations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getOrganizationMembers(
  organizationId: number
): Promise<OrganizationMember[]> {
  return fetchJson<OrganizationMember[]>(
    `/organizations/${organizationId}/members`
  );
}

export function addOrganizationMember(
  organizationId: number,
  payload: AddOrganizationMemberRequest
): Promise<OrganizationMember> {
  return fetchJson<OrganizationMember>(
    `/organizations/${organizationId}/members`,
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}
