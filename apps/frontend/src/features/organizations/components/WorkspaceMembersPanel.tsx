import { useState } from "react";
import type { OrganizationMember } from "../types";
import "./WorkspaceMembersPanel.css";

type WorkspaceMembersPanelProps = {
  members: OrganizationMember[];
  isLoading: boolean;
  isSubmitting?: boolean;
  canAddMembers?: boolean;
  onAddMember?: (email: string) => Promise<void>;
};

export function WorkspaceMembersPanel({
  members,
  isLoading,
  isSubmitting = false,
  canAddMembers = false,
  onAddMember
}: WorkspaceMembersPanelProps) {
  const [email, setEmail] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!onAddMember) {
      return;
    }

    await onAddMember(email);
    setEmail("");
  }

  return (
    <section className="card workspace-members-card">
      <div className="card-header">
        <div>
          <h2>Workspace Members</h2>
          <p className="card-subtitle">
            People who currently have access to this workspace.
          </p>
        </div>
      </div>

      {canAddMembers ? (
        <form className="workspace-member-form" onSubmit={handleSubmit}>
          <label htmlFor="workspace-member-email">
            Add member by email
          </label>

          <div className="workspace-member-form-row">
            <input
              id="workspace-member-email"
              type="email"
              value={email}
              placeholder="member@example.com"
              disabled={isSubmitting}
              onChange={(event) => setEmail(event.target.value)}
            />

            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting || !email.trim()}
            >
              {isSubmitting ? "Adding..." : "Add member"}
            </button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <div className="empty-state">Loading members...</div>
      ) : null}

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

              <span className="workspace-member-role">
                {member.role}
              </span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
