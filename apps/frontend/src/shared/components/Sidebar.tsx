import { appConfig } from "../../app/config";
import { NAVIGATION_ITEMS, type AppView } from "../../app/navigation";
import type { User } from "../../features/auth/types";
import "./Sidebar.css";

type SidebarProps = {
  activeView: AppView;
  currentUser: User | null;
  onNavigate: (view: AppView) => void;
};

export function Sidebar({
  activeView,
  currentUser,
  onNavigate
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">FCP</span>

        <div>
          <strong>{appConfig.appTitle}</strong>
          <span>Cloud platform</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-nav-item ${
              activeView === item.id ? "active" : ""
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <span>{item.label}</span>
            <small>{item.description}</small>
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        <span className="sidebar-user-label">Signed in as</span>
        <strong>{currentUser ? currentUser.email : "Guest"}</strong>
      </div>
    </aside>
  );
}
