from datetime import datetime

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import EmailStr
from pydantic import Field


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class OrganizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    role: str | None = None


class OrganizationMemberCreate(BaseModel):
    email: EmailStr
    role: str = Field(default="member", min_length=1, max_length=50)


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
