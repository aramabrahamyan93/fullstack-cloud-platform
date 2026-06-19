import { fetchJson } from "../../shared/api/client";
import type {
  CreateOrganizationInvitationRequest,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  Organization,
  OrganizationRef,
  OrganizationAuditLog,
  OrganizationDashboardSummary,
  OrganizationInvitation,
  OrganizationInviteCandidate,
  OrganizationMember
} from "./types";

function toOrganizationPathRef(organizationRef: OrganizationRef): string {
  return encodeURIComponent(String(organizationRef));
}

export function getOrganizations(): Promise<Organization[]> {
  return fetchJson<Organization[]>("/organizations");
}

export function getOrganization(
  organizationRef: OrganizationRef
): Promise<Organization> {
  return fetchJson<Organization>(
    `/organizations/${toOrganizationPathRef(organizationRef)}`
  );
}

export function createOrganization(
  payload: CreateOrganizationRequest
): Promise<Organization> {
  return fetchJson<Organization>("/organizations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateOrganization(
  organizationRef: OrganizationRef,
  payload: UpdateOrganizationRequest
): Promise<Organization> {
  return fetchJson<Organization>(
    `/organizations/${toOrganizationPathRef(organizationRef)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    }
  );
}

export function archiveOrganization(
  organizationRef: OrganizationRef
): Promise<Organization> {
  return fetchJson<Organization>(
    `/organizations/${toOrganizationPathRef(organizationRef)}/archive`,
    {
      method: "POST"
    }
  );
}

export function getOrganizationMembers(
  organizationRef: OrganizationRef
): Promise<OrganizationMember[]> {
  return fetchJson<OrganizationMember[]>(
    `/organizations/${toOrganizationPathRef(organizationRef)}/members`
  );
}

export function getOrganizationInvitations(
  organizationRef: OrganizationRef
): Promise<OrganizationInvitation[]> {
  return fetchJson<OrganizationInvitation[]>(
    `/organizations/${toOrganizationPathRef(organizationRef)}/invitations`
  );
}

export function createOrganizationInvitation(
  organizationRef: OrganizationRef,
  payload: CreateOrganizationInvitationRequest
): Promise<OrganizationInvitation> {
  return fetchJson<OrganizationInvitation>(
    `/organizations/${toOrganizationPathRef(organizationRef)}/invitations`,
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export function cancelOrganizationInvitation(
  organizationRef: OrganizationRef,
  invitationId: number
): Promise<void> {
  return fetchJson<void>(
    `/organizations/${toOrganizationPathRef(organizationRef)}/invitations/${invitationId}`,
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

export function getOrganizationInviteCandidates(
  organizationRef: OrganizationRef,
  query: string
): Promise<OrganizationInviteCandidate[]> {
  const searchParams = new URLSearchParams({
    query
  });

  return fetchJson<OrganizationInviteCandidate[]>(
    `/organizations/${toOrganizationPathRef(organizationRef)}/invite-candidates?${searchParams.toString()}`
  );
}

export function removeOrganizationMember(
  organizationRef: OrganizationRef,
  memberId: number
): Promise<void> {
  return fetchJson<void>(
    `/organizations/${toOrganizationPathRef(organizationRef)}/members/${memberId}`,
    {
      method: "DELETE"
    }
  );
}

export function transferOrganizationOwnership(
  organizationRef: OrganizationRef,
  memberId: number
): Promise<void> {
  return fetchJson<void>(
    `/organizations/${toOrganizationPathRef(organizationRef)}/members/${memberId}/transfer-ownership`,
    {
      method: "POST"
    }
  );
}

export function leaveOrganization(
  organizationRef: OrganizationRef
): Promise<void> {
  return fetchJson<void>(
    `/organizations/${toOrganizationPathRef(organizationRef)}/membership`,
    {
      method: "DELETE"
    }
  );
}



export function getOrganizationAuditLogs(
  organizationRef: OrganizationRef
): Promise<OrganizationAuditLog[]> {
  return fetchJson<OrganizationAuditLog[]>(
    `/organizations/${toOrganizationPathRef(organizationRef)}/audit-logs`
  );
}



export function getOrganizationDashboardSummary(
  organizationRef: OrganizationRef
): Promise<OrganizationDashboardSummary> {
  return fetchJson<OrganizationDashboardSummary>(
    `/organizations/${toOrganizationPathRef(organizationRef)}/dashboard`
  );
}
