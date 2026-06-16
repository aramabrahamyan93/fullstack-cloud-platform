export type Organization = {
  id: number;
  name: string;
  role?: OrganizationMemberRole | null;
};

export type CreateOrganizationRequest = {
  name: string;
};

export type UpdateOrganizationRequest = {
  name: string;
};

export type OrganizationMemberRole = "owner" | "member";

export type OrganizationMember = {
  id: number;
  organization_id: number;
  user_id: number;
  role: OrganizationMemberRole;
  email: string;
};

export type OrganizationInvitationStatus =
  | "pending"
  | "accepted"
  | "cancelled"
  | "expired";

export type OrganizationInvitation = {
  id: number;
  organization_id: number;
  organization_name?: string;
  email: string;
  role: string;
  status: OrganizationInvitationStatus;
  invited_by_user_id: number;
  expires_at: string;
  created_at: string;
};

export type CreateOrganizationInvitationRequest = {
  email: string;
  role: "member";
};

export type MyInvitationActionResult = {
  success: boolean;
  message: string;
};

export type OrganizationInviteCandidate = {
  user_id: number;
  email: string;
  membership_status: "member" | "not_member";
  invitation_status: "pending" | null;
};



export type OrganizationAuditLogEventType =
  | "workspace_created"
  | "workspace_renamed"
  | "member_invited"
  | "invitation_accepted"
  | "invitation_declined"
  | "invitation_cancelled"
  | "member_removed"
  | "ownership_transferred"
  | "workspace_left";

export type OrganizationAuditLog = {
  id: number;
  organization_id: number;
  actor_user_id: number;
  event_type: OrganizationAuditLogEventType;
  metadata_json: Record<string, unknown>;
  created_at: string;
};
