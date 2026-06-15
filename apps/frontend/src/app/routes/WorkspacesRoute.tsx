import { OrganizationsPage } from "../../features/organizations/components/OrganizationsPage";
import { Message } from "../../shared/components/Message";
import type { AppController } from "../hooks/useAppController";

type WorkspacesRouteProps = {
  controller: AppController;
};

export function WorkspacesRoute({ controller }: WorkspacesRouteProps) {
  return (
    <>
      <Message message={controller.message} />

      <OrganizationsPage
        isAuthenticated={Boolean(controller.currentUser)}
        organizations={controller.organizations}
        selectedOrganization={controller.selectedOrganization}
        isLoading={controller.isOrganizationsLoading}
        isSubmitting={controller.isOrganizationSubmitting}
        onCreateOrganization={controller.handleCreateOrganization}
        onSelectOrganization={controller.handleSelectOrganization}
        onLeaveOrganization={controller.handleLeaveWorkspaceById}
      />
    </>
  );
}
