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
