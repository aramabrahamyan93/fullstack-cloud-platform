import { Link } from "react-router-dom";
import type { Organization, OrganizationMember } from "../types";
import "./WorkspaceSettingsPage.css";

type WorkspaceSettingsPageProps = {
  workspace: Organization;
  currentMember: OrganizationMember | null;
  isSubmitting: boolean;
  onLeaveWorkspace: () => Promise<void>;
};

export function WorkspaceSettingsPage({
  workspace,
  currentMember,
  isSubmitting,
  onLeaveWorkspace
}: WorkspaceSettingsPageProps) {
  const role = currentMember?.role ?? workspace.role ?? "unknown";
  const isOwner = role === "owner";
  const isMember = role === "member";

  return (
    <div className="workspace-settings-layout">
      <section className="card workspace-settings-card">
        <div className="workspace-settings-hero">
          <div>
            <span className="workspace-settings-eyebrow">Workspace settings</span>
            <h2>{workspace.name}</h2>
            <p className="card-subtitle">
              Review access, role-based actions, and workspace management
              shortcuts.
            </p>
          </div>

          <span className={`workspace-settings-role-badge ${role}`}>
            {role}
          </span>
        </div>

        <div className="workspace-settings-grid">
          <article className="workspace-settings-item">
            <span>Workspace ID</span>
            <strong>#{workspace.id}</strong>
          </article>

          <article className="workspace-settings-item">
            <span>Workspace name</span>
            <strong>{workspace.name}</strong>
          </article>

          <article className="workspace-settings-item">
            <span>Your role</span>
            <strong>{role}</strong>
          </article>
        </div>
      </section>

      <section className="card workspace-settings-card">
        <div className="card-header">
          <div>
            <h2>Quick actions</h2>
            <p className="card-subtitle">
              Jump to the most common workspace areas.
            </p>
          </div>
        </div>

        <div className="workspace-settings-actions-grid">
          <Link
            className="workspace-settings-action-card"
            to={`/workspaces/${workspace.id}/tasks`}
          >
            <strong>Tasks</strong>
            <span>Open workspace-scoped task board.</span>
          </Link>

          <Link
            className="workspace-settings-action-card"
            to={`/workspaces/${workspace.id}/members`}
          >
            <strong>Members</strong>
            <span>
              {isOwner
                ? "Manage members, invitations, and ownership."
                : "View current workspace members."}
            </span>
          </Link>

          <Link
            className="workspace-settings-action-card"
            to="/workspaces"
          >
            <strong>All workspaces</strong>
            <span>Create, switch, or leave available workspaces.</span>
          </Link>
        </div>
      </section>

      <section className="card workspace-settings-card">
        <div className="card-header">
          <div>
            <h2>Access policy</h2>
            <p className="card-subtitle">
              Current workspace permissions are enforced by the backend.
            </p>
          </div>
        </div>

        <div className="workspace-settings-policy-list">
          <article className="workspace-settings-policy-item enabled">
            <strong>Workspace tasks</strong>
            <span>Owners and members can manage workspace tasks.</span>
          </article>

          <article className={`workspace-settings-policy-item ${isOwner ? "enabled" : "muted"}`}>
            <strong>Invitations</strong>
            <span>
              {isOwner
                ? "You can invite users and cancel pending invitations."
                : "Only workspace owners can invite users."}
            </span>
          </article>

          <article className={`workspace-settings-policy-item ${isOwner ? "enabled" : "muted"}`}>
            <strong>Ownership transfer</strong>
            <span>
              {isOwner
                ? "You can transfer ownership to another member."
                : "Only the current owner can transfer ownership."}
            </span>
          </article>
        </div>
      </section>

      <section className="card workspace-settings-card workspace-settings-danger-card">
        <div>
          <span className="workspace-settings-eyebrow danger">Membership</span>
          <h2>Workspace access</h2>
          <p className="card-subtitle">
            Leaving a workspace removes your access to its tasks, members, and
            future workspace updates.
          </p>
        </div>

        {isMember ? (
          <button
            type="button"
            className="danger-button"
            disabled={isSubmitting}
            onClick={() => void onLeaveWorkspace()}
          >
            Leave workspace
          </button>
        ) : null}

        {isOwner ? (
          <div className="workspace-settings-owner-note">
            Owners must transfer ownership before leaving a workspace.
          </div>
        ) : null}

        {!currentMember ? (
          <div className="workspace-settings-owner-note">
            Membership details are still loading or could not be resolved.
          </div>
        ) : null}
      </section>

      <section className="card workspace-settings-card">
        <div className="card-header">
          <div>
            <h2>Coming next</h2>
            <p className="card-subtitle">
              Future settings can include workspace rename, archive/delete
              policy, audit history, and invitation email configuration.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
