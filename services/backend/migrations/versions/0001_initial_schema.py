"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-06-23 00:00:00
"""
from alembic import op
import sqlalchemy as sa


revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("public_id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_organizations_id"), "organizations", ["id"], unique=False)
    op.create_index(op.f("ix_organizations_name"), "organizations", ["name"], unique=False)
    op.create_index(op.f("ix_organizations_public_id"), "organizations", ["public_id"], unique=True)
    op.create_index(op.f("ix_organizations_status"), "organizations", ["status"], unique=False)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "organization_audit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("actor_user_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_organization_audit_logs_actor_user_id"), "organization_audit_logs", ["actor_user_id"], unique=False)
    op.create_index(op.f("ix_organization_audit_logs_event_type"), "organization_audit_logs", ["event_type"], unique=False)
    op.create_index(op.f("ix_organization_audit_logs_id"), "organization_audit_logs", ["id"], unique=False)
    op.create_index(op.f("ix_organization_audit_logs_organization_id"), "organization_audit_logs", ["organization_id"], unique=False)

    op.create_table(
        "organization_invitations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("invited_by_user_id", sa.Integer(), nullable=False),
        sa.Column("token", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["invited_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_organization_invitations_email"), "organization_invitations", ["email"], unique=False)
    op.create_index(op.f("ix_organization_invitations_id"), "organization_invitations", ["id"], unique=False)
    op.create_index(op.f("ix_organization_invitations_invited_by_user_id"), "organization_invitations", ["invited_by_user_id"], unique=False)
    op.create_index(op.f("ix_organization_invitations_organization_id"), "organization_invitations", ["organization_id"], unique=False)
    op.create_index(op.f("ix_organization_invitations_status"), "organization_invitations", ["status"], unique=False)
    op.create_index(op.f("ix_organization_invitations_token"), "organization_invitations", ["token"], unique=True)

    op.create_table(
        "organization_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_organization_members_id"), "organization_members", ["id"], unique=False)
    op.create_index(op.f("ix_organization_members_organization_id"), "organization_members", ["organization_id"], unique=False)
    op.create_index(op.f("ix_organization_members_user_id"), "organization_members", ["user_id"], unique=False)

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.CheckConstraint("status IN ('open', 'in_progress', 'done')", name="ck_tasks_status"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tasks_id"), "tasks", ["id"], unique=False)
    op.create_index(op.f("ix_tasks_organization_id"), "tasks", ["organization_id"], unique=False)
    op.create_index(op.f("ix_tasks_owner_id"), "tasks", ["owner_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_tasks_owner_id"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_organization_id"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_id"), table_name="tasks")
    op.drop_table("tasks")

    op.drop_index(op.f("ix_organization_members_user_id"), table_name="organization_members")
    op.drop_index(op.f("ix_organization_members_organization_id"), table_name="organization_members")
    op.drop_index(op.f("ix_organization_members_id"), table_name="organization_members")
    op.drop_table("organization_members")

    op.drop_index(op.f("ix_organization_invitations_token"), table_name="organization_invitations")
    op.drop_index(op.f("ix_organization_invitations_status"), table_name="organization_invitations")
    op.drop_index(op.f("ix_organization_invitations_organization_id"), table_name="organization_invitations")
    op.drop_index(op.f("ix_organization_invitations_invited_by_user_id"), table_name="organization_invitations")
    op.drop_index(op.f("ix_organization_invitations_id"), table_name="organization_invitations")
    op.drop_index(op.f("ix_organization_invitations_email"), table_name="organization_invitations")
    op.drop_table("organization_invitations")

    op.drop_index(op.f("ix_organization_audit_logs_organization_id"), table_name="organization_audit_logs")
    op.drop_index(op.f("ix_organization_audit_logs_id"), table_name="organization_audit_logs")
    op.drop_index(op.f("ix_organization_audit_logs_event_type"), table_name="organization_audit_logs")
    op.drop_index(op.f("ix_organization_audit_logs_actor_user_id"), table_name="organization_audit_logs")
    op.drop_table("organization_audit_logs")

    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    op.drop_index(op.f("ix_organizations_status"), table_name="organizations")
    op.drop_index(op.f("ix_organizations_public_id"), table_name="organizations")
    op.drop_index(op.f("ix_organizations_name"), table_name="organizations")
    op.drop_index(op.f("ix_organizations_id"), table_name="organizations")
    op.drop_table("organizations")
