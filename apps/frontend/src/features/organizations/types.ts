export type Organization = {
  id: number;
  name: string;
};

export type CreateOrganizationRequest = {
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

export type AddOrganizationMemberRequest = {
  email: string;
  role: OrganizationMemberRole;
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
