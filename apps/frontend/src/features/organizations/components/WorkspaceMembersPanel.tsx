import type { OrganizationMember } from "../types";
import "./WorkspaceMembersPanel.css";

type WorkspaceMembersPanelProps = {
  members: OrganizationMember[];
  isLoading: boolean;
};

export function WorkspaceMembersPanel({
  members,
  isLoading
}: WorkspaceMembersPanelProps) {
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
