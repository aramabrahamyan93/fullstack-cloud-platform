import { useState } from "react";
import type { OrganizationInvitation, OrganizationMember } from "../types";
import "./WorkspaceMembersPanel.css";

type WorkspaceMembersPanelProps = {
  members: OrganizationMember[];
  invitations?: OrganizationInvitation[];
  isLoading: boolean;
  isInvitationsLoading?: boolean;
  isInvitationSubmitting?: boolean;
  canManageInvitations?: boolean;
  onCreateInvitation?: (email: string) => Promise<boolean>;
  onCancelInvitation?: (invitationId: number) => Promise<void>;
};

export function WorkspaceMembersPanel({
  members,
  invitations = [],
  isLoading,
  isInvitationsLoading = false,
  isInvitationSubmitting = false,
  canManageInvitations = false,
  onCreateInvitation,
  onCancelInvitation
}: WorkspaceMembersPanelProps) {
  const [invitationEmail, setInvitationEmail] = useState("");

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending"
  );

  async function handleCreateInvitationSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!onCreateInvitation) {
      return;
    }

    const submittedEmail = invitationEmail.trim();

    if (!submittedEmail) {
      return;
    }

    const wasCreated = await onCreateInvitation(submittedEmail);

    if (wasCreated) {
      setInvitationEmail("");
    }
  }

  return (
    <section className="card workspace-members-card">
      <div className="card-header">
        <div>
          <h2>Workspace Members</h2>
          <p className="card-subtitle">
            People who accepted an invitation and currently have access to this
            workspace.
          </p>
        </div>
      </div>

      {isLoading ? <div className="empty-state">Loading members...</div> : null}

      {!isLoading && members.length === 0 ? (
        <div className="empty-state">No members found.</div>
      ) : null}

      {!isLoading && members.length > 0 ? (
        <div className="workspace-members-list">
          {members.map((member) => (
            <article key={member.id} className="workspace-member-item">
              <div>
                <strong>{member.email}</strong>
                <span>User #{member.user_id}</span>
              </div>

              <span className="workspace-member-role">{member.role}</span>
            </article>
          ))}
        </div>
      ) : null}

      {canManageInvitations ? (
        <section className="workspace-invitations-section">
          <div className="workspace-invitations-header">
            <div>
              <h3>Invite People</h3>
              <p className="card-subtitle">
                Create a pending invitation. The user becomes a member only
                after accepting it.
              </p>
            </div>
          </div>

          <form
            className="workspace-member-form"
            onSubmit={handleCreateInvitationSubmit}
          >
            <label htmlFor="workspace-invitation-email">
              Invite by email
            </label>

            <div className="workspace-member-form-row">
              <input
                id="workspace-invitation-email"
                type="email"
                value={invitationEmail}
                placeholder="person@example.com"
                disabled={isInvitationSubmitting}
                onChange={(event) => setInvitationEmail(event.target.value)}
              />

              <button
                type="submit"
                className="primary-button"
                disabled={isInvitationSubmitting || !invitationEmail.trim()}
              >
                {isInvitationSubmitting ? "Inviting..." : "Create invitation"}
              </button>
            </div>

            <p className="workspace-member-help">
              Registered and unregistered emails both receive a pending
              invitation.
            </p>
          </form>

          <div className="workspace-invitations-header">
            <div>
              <h3>Pending Invitations</h3>
              <p className="card-subtitle">
                Invitations waiting for user acceptance.
              </p>
            </div>
          </div>

          {isInvitationsLoading ? (
            <div className="empty-state">Loading invitations...</div>
          ) : null}

          {!isInvitationsLoading && pendingInvitations.length === 0 ? (
            <div className="empty-state">No pending invitations found.</div>
          ) : null}

          {!isInvitationsLoading && pendingInvitations.length > 0 ? (
            <div className="workspace-members-list">
              {pendingInvitations.map((invitation) => (
                <article
                  key={invitation.id}
                  className="workspace-member-item"
                >
                  <div>
                    <strong>{invitation.email}</strong>
                    <span>Role: {invitation.role}</span>
                  </div>

                  <div className="workspace-invitation-actions">
                    <span className="workspace-member-role">
                      {invitation.status}
                    </span>

                    {onCancelInvitation ? (
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={isInvitationSubmitting}
                        onClick={() => void onCancelInvitation(invitation.id)}
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
