import type { ReactNode } from "react";
import { Sidebar } from "../shared/components/Sidebar";
import type { User } from "../features/auth/types";
import type { AppView } from "./navigation";
import "./AppLayout.css";

type AppLayoutProps = {
  activeView: AppView;
  currentUser: User | null;
  children: ReactNode;
  onNavigate: (view: AppView) => void;
};

export function AppLayout({
  activeView,
  currentUser,
  children,
  onNavigate
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        currentUser={currentUser}
        onNavigate={onNavigate}
      />

      <main className="app-main">{children}</main>
    </div>
  );
}
