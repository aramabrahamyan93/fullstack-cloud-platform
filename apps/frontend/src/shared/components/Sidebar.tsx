import { NavLink } from "react-router-dom";
import { appConfig } from "../../app/config";
import { NAVIGATION_ITEMS, type AppRouteId } from "../../app/navigation";
import type { User } from "../../features/auth/types";
import type { Organization } from "../../features/organizations/types";
import "./Sidebar.css";

type SidebarProps = {
  currentUser: User | null;
  selectedOrganization: Organization | null;
};

export function Sidebar({
  currentUser,
  selectedOrganization
}: SidebarProps) {
  function getNavigationPath(routeId: AppRouteId): string {
    if (routeId === "dashboard") {
      return "/dashboard";
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

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">FCP</span>

        <div>
          <strong>{appConfig.appTitle}</strong>
          <span>Cloud platform</span>
        </div>
      </div>

      <div className="sidebar-workspace">
        <span className="sidebar-user-label">Current workspace</span>
        <strong>{selectedOrganization ? selectedOrganization.name : "No workspace selected"}</strong>
      </div>

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
      </div>
    </aside>
  );
}
