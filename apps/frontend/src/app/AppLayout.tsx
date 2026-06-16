import type { ReactNode } from "react";
import { Sidebar } from "../shared/components/Sidebar";
import type { User } from "../features/auth/types";
import type { Organization } from "../features/organizations/types";
import "./AppLayout.css";

type AppLayoutProps = {
  currentUser: User | null;
  organizations: Organization[];
  selectedOrganization: Organization | null;
  isOrganizationsLoading: boolean;
  children: ReactNode;
  onSelectOrganization: (organizationId: number, targetPath?: string) => void;
  onLogout: () => void;
};

export function AppLayout({
  currentUser,
  organizations,
  selectedOrganization,
  isOrganizationsLoading,
  children,
  onSelectOrganization,
  onLogout
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar
        currentUser={currentUser}
        organizations={organizations}
        selectedOrganization={selectedOrganization}
        isOrganizationsLoading={isOrganizationsLoading}
        onSelectOrganization={onSelectOrganization}
        onLogout={onLogout}
      />

      <main className="app-main">{children}</main>
    </div>
  );
}
