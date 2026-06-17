import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
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
  onSelectOrganization: (organizationId: number, targetPath?: string) => void;
  onLogout: () => void;
};

const GLOBAL_NAVIGATION_ITEMS = NAVIGATION_ITEMS.filter(
  (item) => item.group === "global"
);

const WORKSPACE_NAVIGATION_ITEMS = NAVIGATION_ITEMS.filter(
  (item) => item.group === "workspace"
);

export function Sidebar({
  currentUser,
  organizations,
  selectedOrganization,
  isOrganizationsLoading,
  onSelectOrganization,
  onLogout
}: SidebarProps) {
  const location = useLocation();
  const [isWorkspaceSwitcherOpen, setIsWorkspaceSwitcherOpen] = useState(true);
  const [isGlobalNavigationOpen, setIsGlobalNavigationOpen] = useState(true);
  const [isWorkspaceNavigationOpen, setIsWorkspaceNavigationOpen] = useState(true);

  function getNavigationPath(routeId: AppRouteId): string {
    if (routeId === "global_dashboard") {
      return "/dashboard";
    }

    if (routeId === "system") {
      return "/system";
    }

    if (routeId === "workspaces") {
      return "/workspaces";
    }

    if (!selectedOrganization) {
      return "/workspaces";
    }

    if (routeId === "dashboard") {
      return `/workspaces/${selectedOrganization.public_id}/dashboard`;
    }

    if (routeId === "tasks") {
      return `/workspaces/${selectedOrganization.public_id}/tasks`;
    }

    if (routeId === "members") {
      return `/workspaces/${selectedOrganization.public_id}/members`;
    }

    if (routeId === "settings") {
      return `/workspaces/${selectedOrganization.public_id}/settings`;
    }

    if (routeId === "activity") {
      return `/workspaces/${selectedOrganization.public_id}/activity`;
    }

    return "/workspaces";
  }

  function isWorkspaceSpecificRoute(routeId: AppRouteId): boolean {
    return (
      routeId === "dashboard" ||
      routeId === "tasks" ||
      routeId === "members" ||
      routeId === "settings" ||
      routeId === "activity"
    );
  }

  function isNavigationItemDisabled(routeId: AppRouteId): boolean {
    return isWorkspaceSpecificRoute(routeId) && !selectedOrganization;
  }

  function isNavigationItemActive(routeId: AppRouteId): boolean {
    if (routeId === "global_dashboard") {
      return location.pathname === "/dashboard";
    }

    if (routeId === "system") {
      return location.pathname === "/system";
    }

    if (routeId === "workspaces") {
      return location.pathname === "/workspaces";
    }

    if (routeId === "dashboard") {
      return /^\/workspaces\/[^/]+\/dashboard$/.test(location.pathname);
    }

    if (routeId === "tasks") {
      return /^\/workspaces\/[^/]+\/tasks$/.test(location.pathname);
    }

    if (routeId === "members") {
      return /^\/workspaces\/[^/]+\/members$/.test(location.pathname);
    }

    if (routeId === "settings") {
      return /^\/workspaces\/[^/]+\/settings$/.test(location.pathname);
    }

    if (routeId === "activity") {
      return /^\/workspaces\/[^/]+\/activity$/.test(location.pathname);
    }

    return false;
  }

  function getWorkspaceSwitchPath(organization: Organization): string {
    if (location.pathname.includes("/activity")) {
      return `/workspaces/${organization.public_id}/activity`;
    }

    if (location.pathname.includes("/members")) {
      return `/workspaces/${organization.public_id}/members`;
    }

    if (location.pathname.includes("/settings")) {
      return `/workspaces/${organization.public_id}/settings`;
    }

    if (location.pathname.includes("/tasks")) {
      return `/workspaces/${organization.public_id}/tasks`;
    }

    if (location.pathname.includes("/dashboard")) {
      return `/workspaces/${organization.public_id}/dashboard`;
    }

    return `/workspaces/${organization.public_id}/dashboard`;
  }

  function handleWorkspaceChange(value: string): void {
    const organization = organizations.find(
      (candidate) => candidate.public_id === value
    );

    if (!organization) {
      return;
    }

    onSelectOrganization(organization.id, getWorkspaceSwitchPath(organization));
  }

  function renderNavigationItems(items: typeof NAVIGATION_ITEMS) {
    return items.map((item) => {
      const isActive = isNavigationItemActive(item.id);
      const isDisabled = isNavigationItemDisabled(item.id);
      const className = [
        "sidebar-nav-item",
        isActive ? "active" : "",
        isDisabled ? "disabled" : ""
      ]
        .filter(Boolean)
        .join(" ");

      if (isDisabled) {
        return (
          <div
            key={item.id}
            className={className}
            aria-disabled="true"
            title="Create or select a workspace first"
          >
            <span>{item.label}</span>
            <small>{item.description}</small>
          </div>
        );
      }

      return (
        <Link key={item.id} to={getNavigationPath(item.id)} className={className}>
          <span>{item.label}</span>
          <small>{item.description}</small>
        </Link>
      );
    });
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
        <button
          type="button"
          className="sidebar-section-toggle"
          aria-expanded={isWorkspaceSwitcherOpen}
          onClick={() => setIsWorkspaceSwitcherOpen((isOpen) => !isOpen)}
        >
          <span>Current workspace</span>
          <span aria-hidden="true">{isWorkspaceSwitcherOpen ? "−" : "+"}</span>
        </button>

        {isWorkspaceSwitcherOpen ? (
          <div className="workspace-switcher-content">
            {currentUser ? (
              <>
                <select
                  className="workspace-select"
                  value={selectedOrganization?.public_id ?? ""}
                  disabled={isOrganizationsLoading || organizations.length === 0}
                  onChange={(event) => handleWorkspaceChange(event.target.value)}
                >
                  <option value="">
                    {isOrganizationsLoading
                      ? "Loading workspaces..."
                      : "Select workspace"}
                  </option>

                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.public_id}>
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
          </div>
        ) : (
          <strong className="workspace-collapsed-label">
            {selectedOrganization?.name ?? "No workspace selected"}
          </strong>
        )}
      </section>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <section className="sidebar-nav-section">
          <button
            type="button"
            className="sidebar-section-toggle"
            aria-expanded={isGlobalNavigationOpen}
            onClick={() => setIsGlobalNavigationOpen((isOpen) => !isOpen)}
          >
            <span>Global</span>
            <span aria-hidden="true">{isGlobalNavigationOpen ? "−" : "+"}</span>
          </button>

          {isGlobalNavigationOpen ? (
            <div className="sidebar-nav-group">
              {renderNavigationItems(GLOBAL_NAVIGATION_ITEMS)}
            </div>
          ) : null}
        </section>

        <section className="sidebar-nav-section">
          <button
            type="button"
            className="sidebar-section-toggle"
            aria-expanded={isWorkspaceNavigationOpen}
            onClick={() => setIsWorkspaceNavigationOpen((isOpen) => !isOpen)}
          >
            <span>Workspace</span>
            <span aria-hidden="true">{isWorkspaceNavigationOpen ? "−" : "+"}</span>
          </button>

          {isWorkspaceNavigationOpen ? (
            <div className="sidebar-nav-group">
              {renderNavigationItems(WORKSPACE_NAVIGATION_ITEMS)}
            </div>
          ) : null}
        </section>
      </nav>

      <div className="sidebar-user">
        <span className="sidebar-section-title">Signed in as</span>
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
