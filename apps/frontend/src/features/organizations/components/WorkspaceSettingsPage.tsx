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
  const isOwner = currentMember?.role === "owner";
  const isMember = currentMember?.role === "member";

  return (
    <section className="card workspace-settings-card">
      <div className="card-header">
        <div>
          <h2>Workspace Settings</h2>
          <p className="card-subtitle">
            Review workspace details and available management actions.
          </p>
        </div>
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
          <strong>{currentMember?.role ?? workspace.role ?? "unknown"}</strong>
        </article>
      </div>

      <section className="workspace-settings-section">
        <h3>Access policy</h3>

        {isOwner ? (
          <p className="card-subtitle">
            You are the workspace owner. You can manage members, invitations,
            ownership transfer, and workspace-scoped tasks.
          </p>
        ) : null}

        {isMember ? (
          <p className="card-subtitle">
            You are a workspace member. You can access workspace tasks and
            leave the workspace if you no longer need access.
          </p>
        ) : null}

        {!currentMember ? (
          <p className="card-subtitle">
            Your membership is still loading or could not be resolved.
          </p>
        ) : null}
      </section>

      <section className="workspace-settings-section workspace-settings-danger-zone">
        <div>
          <h3>Membership</h3>
          <p className="card-subtitle">
            Leaving removes your access to this workspace, including its tasks
            and member list.
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
          <p className="workspace-settings-owner-note">
            Owners must transfer ownership before leaving a workspace.
          </p>
        ) : null}
      </section>

      <section className="workspace-settings-section">
        <h3>Coming next</h3>
        <p className="card-subtitle">
          Future settings can include workspace rename, archive/delete policy,
          audit history, and invitation email configuration.
        </p>
      </section>
    </section>
  );
}
