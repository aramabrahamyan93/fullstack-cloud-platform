import { NavLink } from "react-router-dom";
import { appConfig } from "../../app/config";
import { NAVIGATION_ITEMS, type AppRouteId } from "../../app/navigation";
import type { User } from "../../features/auth/types";
import type { Organization } from "../../features/organizations/types";
import "./Sidebar.css";

type SidebarProps = {
  currentUser: User | null;
  organizations: Organization[];
  selectedOrganization: Organization | null;
  isOrganizationsLoading: boolean;
  onSelectOrganization: (organizationId: number) => void;
  onLogout: () => void;
};

export function Sidebar({
  currentUser,
  organizations,
  selectedOrganization,
  isOrganizationsLoading,
  onSelectOrganization,
  onLogout
}: SidebarProps) {
  function getNavigationPath(routeId: AppRouteId): string {
    if (routeId === "dashboard") {
      if (!selectedOrganization) {
        return "/dashboard";
      }

      return `/workspaces/${selectedOrganization.id}/dashboard`;
    }

    if (routeId === "members") {
      if (!selectedOrganization) {
        return "/workspaces";
      }

      return `/workspaces/${selectedOrganization.id}/members`;
    }

    if (routeId === "workspaces") {
      return "/workspaces";
    }

    if (routeId === "system") {
      return "/system";
    }

    if (!selectedOrganization) {
      return "/workspaces";
    }

    return `/workspaces/${selectedOrganization.id}/tasks`;
  }

  function handleWorkspaceChange(value: string): void {
    const organizationId = Number(value);

    if (!Number.isInteger(organizationId) || organizationId <= 0) {
      return;
    }

    onSelectOrganization(organizationId);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">FCP</span>

        <div>
          <strong>{appConfig.appTitle}</strong>
          <span>Cloud platform</span>
        </div>
      </div>

      <section className="workspace-switcher" aria-label="Workspace switcher">
        <span className="sidebar-user-label">Current workspace</span>

        {currentUser ? (
          <>
            <select
              className="workspace-select"
              value={selectedOrganization?.id ?? ""}
              disabled={isOrganizationsLoading || organizations.length === 0}
              onChange={(event) => handleWorkspaceChange(event.target.value)}
            >
              <option value="">
                {isOrganizationsLoading
                  ? "Loading workspaces..."
                  : "Select workspace"}
              </option>

              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>

            {organizations.length === 0 && !isOrganizationsLoading ? (
              <NavLink className="workspace-create-link" to="/workspaces">
                Create your first workspace
              </NavLink>
            ) : null}
          </>
        ) : (
          <strong className="workspace-guest">Login to use workspaces</strong>
        )}
      </section>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {NAVIGATION_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={getNavigationPath(item.id)}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>{item.label}</span>
            <small>{item.description}</small>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <span className="sidebar-user-label">Signed in as</span>
        <strong>{currentUser ? currentUser.email : "Guest"}</strong>

        {currentUser ? (
          <button
            type="button"
            className="sidebar-logout-button"
            onClick={onLogout}
          >
            Logout
          </button>
        ) : null}
      </div>
    </aside>
  );
}
