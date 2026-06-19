import type { Organization, OrganizationAuditLog } from "../types";
import "./WorkspaceActivityPage.css";

type WorkspaceActivityPageProps = {
  workspace: Organization;
  auditLogs: OrganizationAuditLog[];
  isLoading: boolean;
};

const EVENT_LABELS: Record<OrganizationAuditLog["event_type"], string> = {
  workspace_created: "Workspace created",
  workspace_renamed: "Workspace renamed",
  workspace_archived: "Workspace archived",
  workspace_restored: "Workspace restored",
  member_invited: "Member invited",
  invitation_accepted: "Invitation accepted",
  invitation_declined: "Invitation declined",
  invitation_cancelled: "Invitation cancelled",
  member_removed: "Member removed",
  ownership_transferred: "Ownership transferred",
  workspace_left: "Workspace left"
};

const EVENT_DESCRIPTIONS: Record<OrganizationAuditLog["event_type"], string> = {
  workspace_created: "A new workspace was created.",
  workspace_renamed: "The workspace name was updated.",
  workspace_archived: "The workspace was archived.",
  workspace_restored: "The workspace was restored to active mode.",
  member_invited: "A user was invited to join this workspace.",
  invitation_accepted: "A workspace invitation was accepted.",
  invitation_declined: "A workspace invitation was declined.",
  invitation_cancelled: "A pending workspace invitation was cancelled.",
  member_removed: "A member was removed from this workspace.",
  ownership_transferred: "Workspace ownership was transferred to another member.",
  workspace_left: "A member left this workspace."
};

const METADATA_LABELS: Record<string, string> = {
  email: "Email",
  invitation_id: "Invitation ID",
  member_id: "Member ID",
  name: "Workspace name",
  new_name: "New name",
  new_owner_member_id: "New owner member ID",
  new_owner_user_id: "New owner user ID",
  new_status: "New status",
  previous_name: "Previous name",
  previous_status: "Previous status",
  previous_owner_member_id: "Previous owner member ID",
  previous_owner_user_id: "Previous owner user ID",
  role: "Role",
  user_id: "User ID"
};

const EVENT_GROUP_CLASS_NAMES: Record<OrganizationAuditLog["event_type"], string> = {
  workspace_created: "workspace-activity-event-code--workspace",
  workspace_renamed: "workspace-activity-event-code--workspace",
  workspace_archived: "workspace-activity-event-code--workspace",
  workspace_restored: "workspace-activity-event-code--workspace",
  member_invited: "workspace-activity-event-code--invitation",
  invitation_accepted: "workspace-activity-event-code--invitation",
  invitation_declined: "workspace-activity-event-code--invitation",
  invitation_cancelled: "workspace-activity-event-code--invitation",
  member_removed: "workspace-activity-event-code--membership",
  ownership_transferred: "workspace-activity-event-code--ownership",
  workspace_left: "workspace-activity-event-code--membership"
};

function formatEventDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatMetadataKey(key: string): string {
  return (
    METADATA_LABELS[key] ??
    key
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "string") {
    return value.length > 0 ? value : "—";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function getEventCodeClassName(eventType: OrganizationAuditLog["event_type"]): string {
  return [
    "workspace-activity-event-code",
    EVENT_GROUP_CLASS_NAMES[eventType]
  ].join(" ");
}

export function WorkspaceActivityPage({
  workspace,
  auditLogs,
  isLoading
}: WorkspaceActivityPageProps) {
  return (
    <div className="workspace-activity-layout">
      <section className="card workspace-activity-summary-card">
        <div>
          <span className="workspace-activity-eyebrow">Activity history</span>
          <h2>{workspace.name}</h2>
          <p className="card-subtitle">
            Read-only timeline of important workspace actions recorded by the
            backend audit log.
          </p>
        </div>

        <div className="workspace-activity-summary-grid">
          <article className="workspace-activity-summary-item">
            <span>Workspace ID</span>
            <strong>{workspace.public_id}</strong>
          </article>

          <article className="workspace-activity-summary-item">
            <span>Events</span>
            <strong>{auditLogs.length}</strong>
          </article>
        </div>
      </section>

      <section className="card workspace-activity-card">
        <div className="card-header">
          <div>
            <h2>Timeline</h2>
            <p className="card-subtitle">
              Latest workspace events are shown first.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading workspace activity...</div>
        ) : null}

        {!isLoading && auditLogs.length === 0 ? (
          <div className="empty-state">No workspace activity found yet.</div>
        ) : null}

        {!isLoading && auditLogs.length > 0 ? (
          <div className="workspace-activity-list">
            {auditLogs.map((auditLog) => {
              const metadataEntries = Object.entries(auditLog.metadata_json);

              return (
                <article key={auditLog.id} className="workspace-activity-item">
                  <div className="workspace-activity-item-main">
                    <div>
                      <strong>
                        {EVENT_LABELS[auditLog.event_type] ?? auditLog.event_type}
                      </strong>
                      <span className="workspace-activity-description">
                        {EVENT_DESCRIPTIONS[auditLog.event_type] ??
                          "Workspace activity event."}
                      </span>
                      <span>{formatEventDate(auditLog.created_at)}</span>
                    </div>

                    <span className={getEventCodeClassName(auditLog.event_type)}>
                      {auditLog.event_type}
                    </span>
                  </div>

                  <div className="workspace-activity-meta-grid">
                    <div className="workspace-activity-meta-item">
                      <span>Actor user</span>
                      <strong>#{auditLog.actor_user_id}</strong>
                    </div>

                    <div className="workspace-activity-meta-item">
                      <span>Audit ID</span>
                      <strong>#{auditLog.id}</strong>
                    </div>
                  </div>

                  {metadataEntries.length > 0 ? (
                    <dl className="workspace-activity-metadata">
                      {metadataEntries.map(([key, value]) => (
                        <div key={key}>
                          <dt>{formatMetadataKey(key)}</dt>
                          <dd>{formatMetadataValue(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <div className="workspace-activity-no-metadata">
                      No additional event details.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
