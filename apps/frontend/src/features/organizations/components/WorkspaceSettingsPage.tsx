import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Organization, OrganizationMember } from "../types";
import "./WorkspaceSettingsPage.css";

type WorkspaceSettingsPageProps = {
  workspace: Organization;
  currentMember: OrganizationMember | null;
  isSubmitting: boolean;
  onRenameWorkspace: (name: string) => Promise<boolean>;
  onLeaveWorkspace: () => Promise<void>;
  onArchiveWorkspace: () => Promise<boolean>;
  onRestoreWorkspace: () => Promise<boolean>;
  onDeleteWorkspace: () => Promise<boolean>;
};

export function WorkspaceSettingsPage({
  workspace,
  currentMember,
  isSubmitting,
  onRenameWorkspace,
  onLeaveWorkspace,
  onArchiveWorkspace,
  onRestoreWorkspace,
  onDeleteWorkspace
}: WorkspaceSettingsPageProps) {
  const [workspaceName, setWorkspaceName] = useState(workspace.name);

  const role = currentMember?.role ?? workspace.role ?? "unknown";
  const isOwner = role === "owner";
  const isMember = role === "member";
  const isArchived = workspace.status === "archived";
  const normalizedWorkspaceName = workspaceName.trim();
  const isWorkspaceNameEmpty = normalizedWorkspaceName.length === 0;
  const hasWorkspaceNameChanged =
    !isWorkspaceNameEmpty && normalizedWorkspaceName !== workspace.name;
  const renameHelperText = isArchived
    ? "Archived workspaces are read-only and cannot be renamed."
    : isWorkspaceNameEmpty
      ? "Workspace name is required."
      : hasWorkspaceNameChanged
        ? "Save this change to rename the workspace."
        : "No workspace name changes to save.";

  useEffect(() => {
    setWorkspaceName(workspace.name);
  }, [workspace.id, workspace.name]);

  async function handleRenameSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    if (!isOwner || isArchived || !hasWorkspaceNameChanged) {
      return;
    }

    const wasRenamed = await onRenameWorkspace(normalizedWorkspaceName);

    if (wasRenamed) {
      setWorkspaceName(normalizedWorkspaceName);
    }
  }

  async function handleArchiveClick(): Promise<void> {
    if (!isOwner || isArchived) {
      return;
    }

    await onArchiveWorkspace();
  }

  async function handleRestoreClick(): Promise<void> {
    if (!isOwner || !isArchived) {
      return;
    }

    await onRestoreWorkspace();
  }

  async function handleDeleteClick(): Promise<void> {
    if (!isOwner || !isArchived) {
      return;
    }

    await onDeleteWorkspace();
  }

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

          <div className="workspace-settings-badge-group">
            <span className={`workspace-settings-status-badge ${workspace.status}`}>
              {workspace.status}
            </span>
            <span className={`workspace-settings-role-badge ${role}`}>
              {role}
            </span>
          </div>
        </div>

        {isOwner ? (
          <form
            className="workspace-settings-rename-form"
            onSubmit={handleRenameSubmit}
          >
            <label className="form-field workspace-settings-rename-field">
              Workspace name
              <input
                type="text"
                value={workspaceName}
                minLength={1}
                maxLength={200}
                disabled={isSubmitting || isArchived}
                aria-describedby="workspace-rename-help"
                onChange={(event) => setWorkspaceName(event.target.value)}
              />

              <small
                id="workspace-rename-help"
                className={
                  isWorkspaceNameEmpty
                    ? "workspace-settings-form-help error"
                    : "workspace-settings-form-help"
                }
              >
                {renameHelperText}
              </small>
            </label>

            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting || isArchived || !hasWorkspaceNameChanged}
            >
              {isSubmitting ? "Saving..." : "Save name"}
            </button>
          </form>
        ) : (
          <div className="workspace-settings-readonly-note">
            {isArchived
              ? "This workspace is archived and read-only."
              : "Only workspace owners can rename this workspace. You can still use tasks and view workspace details based on your role."}
          </div>
        )}

        <div className="workspace-settings-grid">
          <article className="workspace-settings-item">
            <span>Workspace ID</span>
            <strong>{workspace.public_id}</strong>
          </article>

          <article className="workspace-settings-item">
            <span>Workspace name</span>
            <strong>{workspace.name}</strong>
          </article>

          <article className="workspace-settings-item">
            <span>Your role</span>
            <strong>{role}</strong>
          </article>

          <article className="workspace-settings-item">
            <span>Workspace status</span>
            <strong>{workspace.status}</strong>
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
            to={`/workspaces/${workspace.public_id}/tasks`}
          >
            <strong>Tasks</strong>
            <span>Open workspace-scoped task board.</span>
          </Link>

          <Link
            className="workspace-settings-action-card"
            to={`/workspaces/${workspace.public_id}/members`}
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
          <article className={`workspace-settings-policy-item ${isArchived ? "muted" : "enabled"}`}>
            <strong>Workspace tasks</strong>
            <span>
              {isArchived
                ? "Archived workspaces are read-only. Existing tasks can be viewed, but not changed."
                : "Owners and members can manage workspace tasks. Restored workspaces are fully active again."}
            </span>
          </article>

          <article className={`workspace-settings-policy-item ${isOwner && !isArchived ? "enabled" : "muted"}`}>
            <strong>Invitations</strong>
            <span>
              {isArchived
                ? "Invitations are disabled for archived workspaces."
                : isOwner
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
          <span className="workspace-settings-eyebrow danger">Archive</span>
          <h2>Archive workspace</h2>
          <p className="card-subtitle">
            Archive turns this workspace into read-only mode. Existing data remains visible,
            but rename, invitations, and task writes are disabled.
          </p>
        </div>

        {isOwner ? (
          <button
            type="button"
            className="danger-button"
            disabled={isSubmitting || isArchived}
            onClick={() => void handleArchiveClick()}
          >
            {isArchived ? "Workspace archived" : "Archive workspace"}
          </button>
        ) : (
          <div className="workspace-settings-owner-note">
            Only workspace owners can archive this workspace.
          </div>
        )}
      </section>

      <section className="card workspace-settings-card workspace-settings-restore-card">
        <div>
          <span className="workspace-settings-eyebrow restore">Restore</span>
          <h2>Restore workspace</h2>
          <p className="card-subtitle">
            Restore returns an archived workspace to active mode. Rename,
            invitations, and workspace task writes become available again.
          </p>
        </div>

        {isOwner ? (
          <button
            type="button"
            className="secondary-button"
            disabled={isSubmitting || !isArchived}
            onClick={() => void handleRestoreClick()}
          >
            {isArchived ? "Restore workspace" : "Workspace active"}
          </button>
        ) : (
          <div className="workspace-settings-owner-note">
            Only workspace owners can restore this workspace.
          </div>
        )}
      </section>

      <section className="card workspace-settings-card workspace-settings-delete-card">
        <div>
          <span className="workspace-settings-eyebrow danger">Delete</span>
          <h2>Delete workspace</h2>
          <p className="card-subtitle">
            Delete hides an archived workspace from normal workspace access.
            Active workspaces must be archived before deletion.
          </p>
        </div>

        {isOwner ? (
          <button
            type="button"
            className="danger-button"
            disabled={isSubmitting || !isArchived}
            onClick={() => void handleDeleteClick()}
          >
            {isArchived ? "Delete workspace" : "Archive before delete"}
          </button>
        ) : (
          <div className="workspace-settings-owner-note">
            Only workspace owners can delete this workspace.
          </div>
        )}

        <div className="workspace-settings-owner-note">
          Deleted workspaces are hidden from normal workspace routes and cannot
          be restored from the current UI.
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
              Future settings can include audit history filters, invitation email
              configuration, and advanced retention controls.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
