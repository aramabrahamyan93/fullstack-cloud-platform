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
  member_invited: "Member invited",
  invitation_accepted: "Invitation accepted",
  invitation_declined: "Invitation declined",
  invitation_cancelled: "Invitation cancelled",
  member_removed: "Member removed",
  ownership_transferred: "Ownership transferred",
  workspace_left: "Workspace left"
};

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatMetadataValue(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
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
            <strong>#{workspace.id}</strong>
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
            {auditLogs.map((auditLog) => (
              <article key={auditLog.id} className="workspace-activity-item">
                <div className="workspace-activity-item-main">
                  <div>
                    <strong>
                      {EVENT_LABELS[auditLog.event_type] ?? auditLog.event_type}
                    </strong>
                    <span>{formatEventDate(auditLog.created_at)}</span>
                  </div>

                  <span className="workspace-activity-event-code">
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

                {Object.keys(auditLog.metadata_json).length > 0 ? (
                  <dl className="workspace-activity-metadata">
                    {Object.entries(auditLog.metadata_json).map(([key, value]) => (
                      <div key={key}>
                        <dt>{key}</dt>
                        <dd>{formatMetadataValue(value)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
