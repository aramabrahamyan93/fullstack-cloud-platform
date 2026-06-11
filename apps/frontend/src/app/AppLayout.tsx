import type { ReactNode } from "react";
import { Sidebar } from "../shared/components/Sidebar";
import type { User } from "../features/auth/types";
import type { Organization } from "../features/organizations/types";
import "./AppLayout.css";

type AppLayoutProps = {
  currentUser: User | null;
  selectedOrganization: Organization | null;
  children: ReactNode;
};

export function AppLayout({
  currentUser,
  selectedOrganization,
  children
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar
        currentUser={currentUser}
        selectedOrganization={selectedOrganization}
      />

      <main className="app-main">{children}</main>
    </div>
  );
}
