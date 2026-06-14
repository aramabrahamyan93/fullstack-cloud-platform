import { fetchJson } from "../../shared/api/client";
import type {
  AddOrganizationMemberRequest,
  CreateOrganizationInvitationRequest,
  CreateOrganizationRequest,
  Organization,
  OrganizationInvitation,
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

export function getOrganizationInvitations(
  organizationId: number
): Promise<OrganizationInvitation[]> {
  return fetchJson<OrganizationInvitation[]>(
    `/organizations/${organizationId}/invitations`
  );
}

export function createOrganizationInvitation(
  organizationId: number,
  payload: CreateOrganizationInvitationRequest
): Promise<OrganizationInvitation> {
  return fetchJson<OrganizationInvitation>(
    `/organizations/${organizationId}/invitations`,
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export function cancelOrganizationInvitation(
  organizationId: number,
  invitationId: number
): Promise<void> {
  return fetchJson<void>(
    `/organizations/${organizationId}/invitations/${invitationId}`,
    {
      method: "DELETE"
    }
  );
}


export function getMyOrganizationInvitations(): Promise<OrganizationInvitation[]> {
  return fetchJson<OrganizationInvitation[]>("/organizations/invitations/me");
}

export function acceptMyOrganizationInvitation(
  invitationId: number
): Promise<OrganizationMember> {
  return fetchJson<OrganizationMember>(
    `/organizations/invitations/${invitationId}/accept`,
    {
      method: "POST"
    }
  );
}

export function declineMyOrganizationInvitation(
  invitationId: number
): Promise<OrganizationInvitation> {
  return fetchJson<OrganizationInvitation>(
    `/organizations/invitations/${invitationId}/decline`,
    {
      method: "POST"
    }
  );
}
