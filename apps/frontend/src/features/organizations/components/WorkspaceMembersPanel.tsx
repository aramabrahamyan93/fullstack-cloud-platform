import { useEffect, useRef, useState } from "react";
import type {
  OrganizationInvitation,
  OrganizationInviteCandidate,
  OrganizationMember
} from "../types";
import "./WorkspaceMembersPanel.css";

type WorkspaceMembersPanelProps = {
  members: OrganizationMember[];
  invitations?: OrganizationInvitation[];
  inviteCandidates?: OrganizationInviteCandidate[];
  isLoading: boolean;
  isInvitationsLoading?: boolean;
  isInviteCandidatesLoading?: boolean;
  isInvitationSubmitting?: boolean;
  canManageInvitations?: boolean;
  canLeaveWorkspace?: boolean;
  onCreateInvitation?: (email: string) => Promise<boolean>;
  onCancelInvitation?: (invitationId: number) => Promise<void>;
  onRemoveMember?: (memberId: number) => Promise<void>;
  onTransferOwnership?: (memberId: number) => Promise<void>;
  onLeaveWorkspace?: () => Promise<void>;
  onSearchInviteCandidates?: (query: string) => Promise<void>;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function WorkspaceMembersPanel({
  members,
  invitations = [],
  inviteCandidates = [],
  isLoading,
  isInvitationsLoading = false,
  isInviteCandidatesLoading = false,
  isInvitationSubmitting = false,
  canManageInvitations = false,
  canLeaveWorkspace = false,
  onCreateInvitation,
  onCancelInvitation,
  onRemoveMember,
  onTransferOwnership,
  onLeaveWorkspace,
  onSearchInviteCandidates
}: WorkspaceMembersPanelProps) {
  const [invitationEmail, setInvitationEmail] = useState("");

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending"
  );

  const exactCandidate = inviteCandidates.find(
    (candidate) =>
      candidate.email.toLowerCase() === invitationEmail.trim().toLowerCase()
  );

  const canInviteTypedEmail =
    isValidEmail(invitationEmail.trim()) &&
    (!exactCandidate ||
      (exactCandidate.membership_status === "not_member" &&
        exactCandidate.invitation_status !== "pending"));

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

  function handleSearchChange(value: string): void {
    setInvitationEmail(value);
  }

  const onSearchInviteCandidatesRef = useRef(onSearchInviteCandidates);
  const lastSearchQueryRef = useRef<string>("");

  useEffect(() => {
    onSearchInviteCandidatesRef.current = onSearchInviteCandidates;
  }, [onSearchInviteCandidates]);

  useEffect(() => {
    if (!canManageInvitations || !onSearchInviteCandidatesRef.current) {
      return;
    }

    const normalizedQuery = invitationEmail.trim();

    const timeoutId = window.setTimeout(() => {
      if (lastSearchQueryRef.current === normalizedQuery) {
        return;
      }

      lastSearchQueryRef.current = normalizedQuery;
      void onSearchInviteCandidatesRef.current?.(normalizedQuery);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [canManageInvitations, invitationEmail]);

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

        {canLeaveWorkspace && onLeaveWorkspace ? (
          <button
            type="button"
            className="danger-button"
            disabled={isInvitationSubmitting}
            onClick={() => void onLeaveWorkspace()}
          >
            Leave workspace
          </button>
        ) : null}
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

              <div className="workspace-invitation-actions">
                <span className="workspace-member-role">{member.role}</span>

                {canManageInvitations &&
                member.role === "member" &&
                onTransferOwnership ? (
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={isInvitationSubmitting}
                    onClick={() => void onTransferOwnership(member.id)}
                  >
                    Transfer ownership
                  </button>
                ) : null}

                {canManageInvitations &&
                member.role === "member" &&
                onRemoveMember ? (
                  <button
                    type="button"
                    className="danger-button"
                    disabled={isInvitationSubmitting}
                    onClick={() => void onRemoveMember(member.id)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
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
                Search registered users, or enter a full email to invite someone who is not registered yet.
              </p>
            </div>
          </div>

          <form
            className="workspace-member-form"
            onSubmit={handleCreateInvitationSubmit}
          >
            <label htmlFor="workspace-invitation-email">
              Search registered users or enter full email
            </label>

            <div className="workspace-member-form-row">
              <input
                id="workspace-invitation-email"
                type="email"
                value={invitationEmail}
                placeholder="person@example.com"
                disabled={isInvitationSubmitting}
                onChange={(event) => handleSearchChange(event.target.value)}
              />

              <button
                type="submit"
                className="primary-button"
                disabled={
                  isInvitationSubmitting ||
                  !invitationEmail.trim() ||
                  !canInviteTypedEmail
                }
              >
                {isInvitationSubmitting ? "Inviting..." : "Invite email"}
              </button>
            </div>

            <p className="workspace-member-help">
              Search results show registered users only. Email-only invitations appear in Pending Invitations.
            </p>
          </form>

          {isInviteCandidatesLoading ? (
            <div className="empty-state">Searching users...</div>
          ) : null}

          {!isInviteCandidatesLoading &&
          invitationEmail.trim().length >= 2 &&
          inviteCandidates.length === 0 ? (
            <div className="empty-state">
              No registered users found. You can invite this email directly if
              it is valid.
            </div>
          ) : null}

          {!isInviteCandidatesLoading && inviteCandidates.length > 0 ? (
            <div className="workspace-members-list">
              {inviteCandidates.map((candidate) => {
                const isMember = candidate.membership_status === "member";
                const isPending = candidate.invitation_status === "pending";
                const canInvite = !isMember && !isPending;

                return (
                  <article
                    key={candidate.user_id}
                    className="workspace-member-item"
                  >
                    <div>
                      <strong>{candidate.email}</strong>
                      <span>
                        {isMember
                          ? "Already a workspace member"
                          : isPending
                            ? "Invitation already pending"
                            : "Registered user"}
                      </span>
                    </div>

                    {canInvite ? (
                      <button
                        type="button"
                        className="primary-button"
                        disabled={isInvitationSubmitting}
                        onClick={() =>
                          void onCreateInvitation?.(candidate.email)
                        }
                      >
                        Invite
                      </button>
                    ) : (
                      <span className="workspace-member-role">
                        {isMember ? "member" : "pending"}
                      </span>
                    )}
                  </article>
                );
              })}
            </div>
          ) : null}

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
