from datetime import datetime

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import EmailStr
from pydantic import Field


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class OrganizationUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class OrganizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    role: str | None = None



class OrganizationTaskCountsRead(BaseModel):
    all: int
    open: int
    in_progress: int
    done: int


class OrganizationDashboardRead(BaseModel):
    organization_id: int
    task_counts: OrganizationTaskCountsRead
    members_count: int
    pending_invitations_count: int
    recent_activity_count: int


class OrganizationMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    user_id: int
    role: str
    email: str


class OrganizationInvitationCreate(BaseModel):
    email: EmailStr
    role: str = Field(default="member", min_length=1, max_length=50)


class OrganizationInvitationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    email: str
    role: str
    status: str
    invited_by_user_id: int
    expires_at: datetime
    created_at: datetime


class MyOrganizationInvitationRead(BaseModel):
    id: int
    organization_id: int
    organization_name: str
    email: str
    role: str
    status: str
    invited_by_user_id: int
    expires_at: datetime
    created_at: datetime


class OrganizationInviteCandidateRead(BaseModel):
    user_id: int
    email: str
    membership_status: str
    invitation_status: str | None = None



class OrganizationAuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    actor_user_id: int
    event_type: str
    metadata_json: dict
    created_at: datetime
