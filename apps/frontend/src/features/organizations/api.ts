import { fetchJson } from "../../shared/api/client";
import type {
  CreateOrganizationRequest,
  Organization
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
