import type { OrganizationInvitation } from "../types";
import "./MyInvitationsPanel.css";

type MyInvitationsPanelProps = {
  invitations: OrganizationInvitation[];
  isLoading: boolean;
  isSubmitting: boolean;
  onAccept: (invitationId: number) => Promise<void>;
  onDecline: (invitationId: number) => Promise<void>;
};

export function MyInvitationsPanel({
  invitations,
  isLoading,
  isSubmitting,
  onAccept,
  onDecline
}: MyInvitationsPanelProps) {
  if (isLoading) {
    return (
      <section className="card my-invitations-card">
        <h2>Workspace Invitations</h2>
        <div className="empty-state">Loading invitations...</div>
      </section>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <section className="card my-invitations-card">
      <div className="card-header">
        <div>
          <h2>Workspace Invitations</h2>
          <p className="card-subtitle">
            You have pending workspace invitations. Accept one to join the
            workspace.
          </p>
        </div>
      </div>

      <div className="my-invitations-list">
        {invitations.map((invitation) => (
          <article key={invitation.id} className="my-invitation-item">
            <div>
              <strong>{invitation.organization_name ?? `Workspace #${invitation.organization_id}`}</strong>
              <span>{invitation.email}</span>
              <span>Role: {invitation.role}</span>
            </div>

            <div className="my-invitation-actions">
              <button
                type="button"
                className="primary-button"
                disabled={isSubmitting}
                onClick={() => void onAccept(invitation.id)}
              >
                Accept
              </button>

              <button
                type="button"
                className="secondary-button"
                disabled={isSubmitting}
                onClick={() => void onDecline(invitation.id)}
              >
                Decline
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
