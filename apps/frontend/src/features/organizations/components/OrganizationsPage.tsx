import { useState, type FormEvent } from "react";
import type { Organization } from "../types";
import "./OrganizationsPage.css";

type OrganizationsPageProps = {
  isAuthenticated: boolean;
  organizations: Organization[];
  selectedOrganization: Organization | null;
  isLoading: boolean;
  isSubmitting: boolean;
  onCreateOrganization: (name: string) => Promise<void>;
  onSelectOrganization: (organizationId: number) => void;
  onLeaveOrganization?: (organizationId: number) => Promise<void>;
};

export function OrganizationsPage({
  isAuthenticated,
  organizations,
  selectedOrganization,
  isLoading,
  isSubmitting,
  onCreateOrganization,
  onSelectOrganization,
  onLeaveOrganization
}: OrganizationsPageProps) {
  const [name, setName] = useState("My Workspace");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onCreateOrganization(name);
    setName("");
  }

  if (!isAuthenticated) {
    return (
      <section className="card">
        <div className="card-header">
          <div>
            <h1>Workspaces</h1>
            <p className="card-subtitle">
              Login or register to manage organizations and workspaces.
            </p>
          </div>
        </div>

        <div className="empty-state">
          Please login or register to manage workspaces.
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page-header">
        <div>
          <h1>Workspaces</h1>
          <p className="card-subtitle">
            Create and select organizations for team-scoped task management.
          </p>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>Create workspace</h2>
            <p className="card-subtitle">
              New workspaces are created with you as the owner.
            </p>
          </div>
        </div>

        <form className="organization-form" onSubmit={handleSubmit}>
          <label className="form-field organization-name-field">
            Workspace name
            <input
              type="text"
              value={name}
              disabled={isSubmitting}
              onChange={(event) => setName(event.target.value)}
              minLength={1}
              maxLength={200}
              required
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create workspace"}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>Your workspaces</h2>
            <p className="card-subtitle">
              Select a workspace before moving tasks under organization context.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading workspaces...</div>
        ) : organizations.length === 0 ? (
          <div className="empty-state">
            No workspaces yet. Create your first workspace above.
          </div>
        ) : (
          <div className="organization-list">
            {organizations.map((organization) => {
              const isSelected = selectedOrganization?.id === organization.id;

              return (
                <article
                  key={organization.id}
                  className={`organization-list-item ${
                    isSelected ? "active" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="organization-list-main"
                    onClick={() => onSelectOrganization(organization.id)}
                  >
                    <span>{organization.public_id}</span>
                    <strong>{organization.name}</strong>
                    {organization.status === "archived" ? (
                      <span className="organization-status-badge archived">
                        archived
                      </span>
                    ) : null}
                  </button>

                  <div className="organization-list-actions">
                    {organization.role ? (
                      <span className="workspace-member-role">
                        {organization.role}
                      </span>
                    ) : null}

                    <button
                      type="button"
                      className="secondary-button"
                      disabled={isSubmitting}
                      onClick={() => onSelectOrganization(organization.id)}
                    >
                      Open
                    </button>

                    {organization.role === "member" && onLeaveOrganization ? (
                      <button
                        type="button"
                        className="danger-button"
                        disabled={isSubmitting}
                        onClick={() => void onLeaveOrganization(organization.id)}
                      >
                        Leave
                      </button>
                    ) : null}

                    {organization.role === "owner" ? (
                      <span className="organization-owner-help">
                        Transfer ownership before leaving
                      </span>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
